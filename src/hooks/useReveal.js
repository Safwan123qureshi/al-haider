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
 * Adds `.reveal-active` to <html> (actually done in main.jsx BEFORE first
 * paint so nothing flashes visible-then-hidden), then reveals elements by
 * adding `.is-inview` as they enter the viewport. A MutationObserver
 * re-observes elements created later (e.g. menu cards after a category
 * filter change).
 *
 * Correctness rules learned from the "black menu" bug:
 *  - IntersectionObserver thresholds are ALWAYS 0 here. A percentage
 *    threshold is evaluated against the target's full size, so a grid taller
 *    than ~12 viewports (the 52-item All Items grid on a phone, 22,000px+)
 *    could never reach it and stayed permanently invisible.
 *  - Menu products themselves are never hidden by this system at all — grid
 *    children animate in via CSS on mount (see premium.css). Only decorative
 *    section blocks use the observer-gated start state, and even those have
 *    scroll + timer failsafes below, so content can never get stuck hidden.
 *
 * Safe fallbacks:
 *  - no IntersectionObserver (jsdom/tests, very old browsers) or
 *  - prefers-reduced-motion
 *  → `.reveal-active` is removed again, every reveal target is marked visible
 *    immediately and the hidden start styles are never left enabled.
 */
export default function useReveal() {
  useEffect(() => {
    const root = document.documentElement;

    if (typeof window.IntersectionObserver === "undefined" || matches("(prefers-reduced-motion: reduce)")) {
      root.classList.remove("reveal-active");
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
      // Any pixel of the target crossing the viewport counts. Never use a
      // percentage threshold: it scales with the target's own height.
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );

    const scan = () => {
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (!el.classList.contains("is-inview")) observer.observe(el);
      });
    };

    /**
     * Failsafe: force-reveal everything at-or-above the fold. Runs on a few
     * timers after load and (throttled) while scrolling/resizing, so even if
     * the observer misbehaves (known issues in some mobile webviews), any
     * content the customer can actually see is revealed regardless.
     */
    const revealInView = () => {
      const vh = window.innerHeight || 0;
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (el.classList.contains("is-inview")) return;
        // top < viewport height covers everything visible OR scrolled past.
        if (el.getBoundingClientRect().top < vh) {
          el.classList.add("is-inview");
          observer.unobserve(el);
        }
      });
    };

    scan();

    const failsafeTimers = [400, 1500, 4000].map((ms) =>
      window.setTimeout(revealInView, ms)
    );

    let scrollTimer = 0;
    const onViewportChange = () => {
      if (scrollTimer) return;
      scrollTimer = window.setTimeout(() => {
        scrollTimer = 0;
        revealInView();
      }, 180);
    };
    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("resize", onViewportChange, { passive: true });
    window.addEventListener("orientationchange", onViewportChange, { passive: true });

    // Debounced re-scan: bursts of DOM mutations (cart badge updates, "✓ Added"
    // state flips, filter changes) collapse into a single scan ~120ms later
    // instead of one full-document query per animation frame.
    let scanTimer = 0;
    const scheduleScan = () => {
      if (scanTimer) return;
      scanTimer = window.setTimeout(() => {
        scanTimer = 0;
        scan();
      }, 120);
    };

    const mutation =
      typeof window.MutationObserver !== "undefined"
        ? new MutationObserver(scheduleScan)
        : null;
    mutation?.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (scanTimer) clearTimeout(scanTimer);
      if (scrollTimer) clearTimeout(scrollTimer);
      failsafeTimers.forEach((t) => clearTimeout(t));
      observer.disconnect();
      mutation?.disconnect();
      window.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("orientationchange", onViewportChange);
      root.classList.remove("reveal-active");
      markAllVisible();
    };
  }, []);
}