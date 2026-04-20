// Helpers for X (Twitter) share URL construction and navigation routing.
// Extracted so the logic can be unit-tested without rendering the full
// ResultsDisplay component tree.

export const isMobileUA = (ua: string): boolean =>
  /iPhone|iPad|iPod/i.test(ua);

export const buildTweetUrl = (text: string): string =>
  `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;

export type XShareNavigation =
  | { mode: "same-tab"; url: string }
  | { mode: "new-tab"; url: string };

export const decideXShareNavigation = (
  text: string,
  ua: string
): XShareNavigation => {
  const url = buildTweetUrl(text);
  return isMobileUA(ua)
    ? { mode: "same-tab", url }
    : { mode: "new-tab", url };
};