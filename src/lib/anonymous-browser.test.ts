import { beforeEach, expect, it, vi } from "vitest";
import { getAnonymousBrowserId } from "./anonymous-browser";
import { analyzeImageStream } from "./analyze-stream";

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
it("retains one random browser UUID across trial requests", () => {
  const id = getAnonymousBrowserId();
  expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  expect(getAnonymousBrowserId()).toBe(id);
});
it("allows a signed-out single scan and sends the browser UUID", async () => {
  const id = getAnonymousBrowserId();
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('event: done\ndata: {"reasons":[],"tips":[]}\n\n'));
  const onDone = vi.fn();
  await analyzeImageStream(new File(["test"], "test.png"), { onDone, onError: vi.fn(), onModel: vi.fn(), onConsensus: vi.fn() }, null, null, id);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const request = fetchMock.mock.calls[0][1];
  expect((request?.body as FormData).get("browser_id")).toBe(id);
  expect(new Headers(request?.headers).has("Authorization")).toBe(false);
  expect(onDone).toHaveBeenCalledTimes(1);
});
it("displays the friendly 24-hour quota message", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "anonymous_limit_reached", message: "One scan per 24 hours. Please sign up." }), { status: 429 }));
  await expect(analyzeImageStream(new File(["test"], "test.png"), { onDone: vi.fn(), onError: vi.fn(), onModel: vi.fn(), onConsensus: vi.fn() }, null, null, getAnonymousBrowserId())).rejects.toThrow("One scan per 24 hours. Please sign up.");
});