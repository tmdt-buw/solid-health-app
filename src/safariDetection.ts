export type NavigatorLike = {
  userAgent?: string;
  vendor?: string;
};

const SAFARI_USER_AGENT = /Safari/i;
const APPLE_VENDOR = /Apple Computer/i;
const SAFARI_EXCLUSIONS =
  /Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPR|OPiOS|Android/i;

export function isSafariBrowser(navigatorLike: NavigatorLike = {}) {
  const userAgent = String(navigatorLike.userAgent || "");
  const vendor = String(navigatorLike.vendor || "");

  return (
    APPLE_VENDOR.test(vendor) &&
    SAFARI_USER_AGENT.test(userAgent) &&
    !SAFARI_EXCLUSIONS.test(userAgent)
  );
}

export function markSafariBrowser(
  documentElement: HTMLElement | null =
    typeof document === "undefined" ? null : document.documentElement,
  navigatorLike: NavigatorLike =
    typeof navigator === "undefined" ? {} : navigator
) {
  const isSafari = isSafariBrowser(navigatorLike);
  documentElement?.classList.toggle("browser-safari", isSafari);
  return isSafari;
}
