import { render, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
const mocks = vi.hoisted(() => ({ stream: vi.fn(), files: [] as File[], track: vi.fn(), fetch: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "test" }, subscription: { tier: "pro" }, refreshSubscription: vi.fn() }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "test" } } }) }, storage: { from: () => ({ upload: async () => ({ error: true }) }) }, from: () => ({ insert: async () => ({}) }) } }));
vi.mock("@/lib/compress-image", () => ({ compressImage: async (file: File) => file }));
vi.mock("@/lib/analyze-stream", () => ({ analyzeImageStream: mocks.stream }));
vi.mock("@/lib/recaptcha", () => ({ getRecaptchaToken: async () => null }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/components/UploadSection", async () => {
  const { forwardRef } = await import("react");
  return { default: forwardRef<HTMLDivElement, { onAnalyze: (files: File[]) => void }>((props, ref) => <div ref={ref}><button onClick={() => props.onAnalyze(mocks.files)}>Run</button></div>) };
});
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/HeroSection", () => ({ default: () => null }));
vi.mock("@/components/ResultsDisplay", () => ({ default: () => null }));
vi.mock("@/components/BatchResultsDisplay", () => ({ default: () => null }));
vi.mock("@/components/HowItWorks", () => ({ default: () => null }));
vi.mock("@/components/WhyFiveModels", () => ({ default: () => null }));
vi.mock("@/components/WhoItsFor", () => ({ default: () => null }));
vi.mock("@/components/FeaturesSection", () => ({ default: () => null }));
vi.mock("@/components/PricingSection", () => ({ default: () => null }));
vi.mock("@/components/DemoSection", () => ({ default: () => null }));
vi.mock("@/components/TrustSection", () => ({ default: () => null }));
vi.mock("@/components/FinalCTA", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
import Index from "./Index";
const result = { verdict: "human", confidence: 0, reasons: [], tips: [] };
function open() { return render(<HelmetProvider><MemoryRouter><Index /></MemoryRouter></HelmetProvider>); }
beforeEach(() => {
  sessionStorage.clear(); mocks.track.mockReset(); mocks.stream.mockReset(); mocks.fetch.mockReset();
  window.__lovableEvents = { track: mocks.track };
  vi.stubGlobal("fetch", mocks.fetch);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0));
  URL.createObjectURL = vi.fn(() => "blob:test"); window.scrollTo = vi.fn();
  mocks.files = [new File(["image"], "one.png", { type: "image/png" })];
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); delete window.__lovableEvents; });
describe("completed results measurement", () => {
  it("counts one fresh completed single image, not partial consensus", async () => {
    mocks.stream.mockImplementation(async (_file, cb) => {
      cb.onConsensus({ ...result, modelsCompleted: 1, modelsTotal: 4 });
      expect(mocks.track).not.toHaveBeenCalled();
      cb.onDone(result);
    });
    open().getByText("Run").click();
    await waitFor(() => expect(mocks.track).toHaveBeenCalledWith("project.analysis_results_shown", { image_count: 1, mode: "single" }));
    expect(mocks.track).toHaveBeenCalledTimes(1);
  });
  it("counts only successfully displayed batch images", async () => {
    mocks.files.push(new File(["image"], "two.png", { type: "image/png" }));
    mocks.fetch.mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify(result) }).mockResolvedValueOnce({ ok: false, status: 500, text: async () => JSON.stringify({ error: "failed" }) });
    open().getByText("Run").click();
    await waitFor(() => expect(mocks.track).toHaveBeenCalledWith("project.analysis_results_shown", { image_count: 1, mode: "batch" }));
    expect(mocks.track).toHaveBeenCalledTimes(1);
  });
  it("does not count a failed analysis", async () => {
    mocks.stream.mockRejectedValue(new Error("failed"));
    open().getByText("Run").click();
    await waitFor(() => expect(mocks.stream).toHaveBeenCalled());
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(mocks.track).not.toHaveBeenCalled();
  });
  it("does not recount results restored from an earlier analysis", async () => {
    sessionStorage.setItem("lastAnalysisResult", JSON.stringify({ result, preview: "blob:test", timestamp: Date.now() }));
    open();
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(mocks.track).not.toHaveBeenCalled();
  });
});
