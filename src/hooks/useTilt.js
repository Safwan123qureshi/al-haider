import { useEffect, useRef } from "react";

const matches = (query) =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(query).matches;

/**
 * Lightweight 3D hover tilt.
 *
 * Attaches passive pointer listeners to the returned ref element and writes
 * CSS custom properties (--tilt-rx, --tilt-ry, --glare-x, --glare-y) that the
 * stylesheet turns into perspective transforms. No per-frame React renders.
 *
 * Guards:
 *  - only binds on hover-capable fine pointers (mouse/trackpad) so touch
 *    devices keep a stable, fully tappable card;
 *  - never binds when the user prefers reduced motion;
 *  - rAF-throttled so fast pointer movement cannot queue excessive style writes.
 */
export default function useTilt({ max = 7 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!matches("(hover: hover) and (pointer: fine)")) return undefined;
    if (matches("(prefers-reduced-motion: reduce)")) return undefined;

    let frame = 0;
    // Skip style writes when the tilt angle has not materially changed —
    // avoids constant style invalidation while the pointer hovers nearly still.
    let lastRx = "";
    let lastRy = "";

    const write = (rx, ry, gx, gy) => {
      if (rx === lastRx && ry === lastRy) return;
      lastRx = rx;
      lastRy = ry;
      el.style.setProperty("--tilt-rx", `${rx}deg`);
      el.style.setProperty("--tilt-ry", `${ry}deg`);
      el.style.setProperty("--glare-x", `${gx}%`);
      el.style.setProperty("--glare-y", `${gy}%`);
    };

    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      write(0, 0, 50, 50);
    };

    const onMove = (event) => {
      // Extra safety: only mouse-like pointers (never touch drags).
      if (event.pointerType && event.pointerType !== "mouse") return;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
        write(
          (-y * max).toFixed(2),
          (x * max).toFixed(2),
          (((x + 1) / 2) * 100).toFixed(1),
          (((y + 1) / 2) * 100).toFixed(1)
        );
      });
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    el.addEventListener("pointercancel", reset);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      el.removeEventListener("pointercancel", reset);
      ["--tilt-rx", "--tilt-ry", "--glare-x", "--glare-y"].forEach((p) =>
        el.style.removeProperty(p)
      );
    };
  }, [max]);

  return ref;
}