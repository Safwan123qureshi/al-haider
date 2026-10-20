import { useEffect } from "react";

const SELECTOR = "[data-reveal], [data-reveal-grid]";

const matches = (query) =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(query).matches;

function markAllVisible() {
  if (typeof document === "undefined") return;
  document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add("is-inview"));
}

/**
 * Global scroll-reveal manager (mounted once in <App />).
 *
 * Adds `.reveal-active` to <html>, which enables the hidden start states in
 * premium.css, then reveals elements by adding `.is-inview` as they enter the
 * viewport. A MutationObserver re-observes elements created later (e.g. menu
 * cards after a category filter change).
 *
 * Safe fallbacks:
 *  - no IntersectionObserver (jsdom/tests, very old browsers) or
 *  - prefers-reduced-motion
 *  → every reveal target is marked visible immediately and the hidden styles
 *    are never enabled, so content can never get stuck invisible.
 */
export default function useReveal() {
  useEffect(() => {
    const root = document.documentElement;

    if (typeof window.IntersectionObserver === "undefined" || matches("(prefers-reduced-motion: reduce)")) {
      markAllVisible();
      return undefined;
    }

    root.classList.add("reveal-active");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-inview");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -48px 0px" }
    );

    const scan = () => {
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (!el.classList.contains("is-inview")) observer.observe(el);
      });
    };

    scan();

    let scanFrame = 0;
    const scheduleScan = () => {
      if (scanFrame) return;
      scanFrame = requestAnimationFrame(() => {
        scanFrame = 0;
        scan();
      });
    };

    const mutation =
      typeof window.MutationObserver !== "undefined"
        ? new MutationObserver(scheduleScan)
        : null;
    mutation?.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (scanFrame) cancelAnimationFrame(scanFrame);
      observer.disconnect();
      mutation?.disconnect();
      root.classList.remove("reveal-active");
      markAllVisible();
    };
  }, []);
}