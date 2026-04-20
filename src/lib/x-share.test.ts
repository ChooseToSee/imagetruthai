import { describe, it, expect } from "vitest";
import { decideXShareNavigation, buildTweetUrl, isMobileUA } from "./x-share";

const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const CHROME_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36";

describe("buildTweetUrl", () => {
  it("uses x.com/intent/tweet, not twitter.com", () => {
    const url = buildTweetUrl("hello world");
    expect(url.startsWith("https://x.com/intent/tweet?text=")).toBe(true);
    expect(url).not.toContain("twitter.com");
  });

  it("URL-encodes special characters and emojis", () => {
    const url = buildTweetUrl("🔍 95% — AI indicators detected");
    expect(url).toContain("%F0%9F%94%8D");
    expect(url).toContain("%E2%80%94"); // em dash
    expect(url).toContain("95%25"); // percent sign encoded
  });
});

describe("isMobileUA", () => {
  it("matches iPhone, iPad, and iPod", () => {
    expect(isMobileUA(SAFARI_IPHONE)).toBe(true);
    expect(isMobileUA(IPAD)).toBe(true);
    expect(isMobileUA("Mozilla/5.0 (iPod touch; CPU iPhone OS 16_0)")).toBe(true);
  });

  it("does not match desktop Chrome", () => {
    expect(isMobileUA(CHROME_DESKTOP)).toBe(false);
  });

  it("does not match Android (handled separately, not by same-tab path)", () => {
    // The X handler intentionally only forces same-tab on iOS Safari,
    // since the popup-blocking issue is iOS-specific.
    expect(isMobileUA(ANDROID_CHROME)).toBe(false);
  });
});

describe("decideXShareNavigation", () => {
  it("uses same-tab navigation on Safari iPhone", () => {
    const decision = decideXShareNavigation("hi", SAFARI_IPHONE);
    expect(decision.mode).toBe("same-tab");
    expect(decision.url).toContain("https://x.com/intent/tweet?text=hi");
  });

  it("uses same-tab navigation on iPad", () => {
    expect(decideXShareNavigation("hi", IPAD).mode).toBe("same-tab");
  });

  it("opens a new tab on Chrome desktop", () => {
    const decision = decideXShareNavigation("hi", CHROME_DESKTOP);
    expect(decision.mode).toBe("new-tab");
    expect(decision.url).toContain("https://x.com/intent/tweet?text=hi");
  });

  it("opens a new tab on Android Chrome (not same-tab)", () => {
    expect(decideXShareNavigation("hi", ANDROID_CHROME).mode).toBe("new-tab");
  });
});