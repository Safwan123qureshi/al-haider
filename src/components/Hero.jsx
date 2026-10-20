import { useEffect, useRef } from "react";
import { useCart } from "../context/CartContext.jsx";
import { offerConfig } from "../data/offer.js";
import { siteInfo } from "../data/site.js";

const mq = (query) =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(query)
    : null;

export default function Hero() {
  const { offerStatus } = useCart();
  const rootRef = useRef(null);

  /**
   * Lightweight pointer + scroll parallax.
   * Only ever writes CSS custom properties on the hero root — no React
   * re-renders, rAF-throttled, skipped entirely for reduced motion, and the
   * pointer part only binds on hover-capable fine pointers.
   */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;

    const reduced = mq("(prefers-reduced-motion: reduce)");
    if (reduced && reduced.matches) return undefined;

    // Evaluated ONCE at mount — never per pointer frame.
    const finePointer = mq("(hover: hover) and (pointer: fine)")?.matches === true;

    let parked = false; // true when the hero is nearly off-screen
    let moveFrame = 0;
    let scrollFrame = 0;

    const onMove = (event) => {
      if (moveFrame) return; // rAF-coalesced: at most one write per frame
      moveFrame = requestAnimationFrame(() => {
        moveFrame = 0;
        const x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
        const y = (event.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
        el.style.setProperty("--hero-mx", x.toFixed(3));
        el.style.setProperty("--hero-my", y.toFixed(3));
      });
    };

    const resetTilt = () => {
      el.style.setProperty("--hero-mx", "0");
      el.style.setProperty("--hero-my", "0");
    };

    const onScroll = () => {
      if (scrollFrame || parked) return; // skip work entirely while parked
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const heroHeight = el.offsetHeight || window.innerHeight;
        if (window.scrollY <= heroHeight) {
          el.style.setProperty("--hero-scroll", `${window.scrollY.toFixed(1)}px`);
        }
      });
    };

    // Pause every continuous hero animation (background zoom, floats, rings,
    // glows, sheen…) once the hero has scrolled out of view, so the page runs
    // zero sustained animation work while the user reads the menu.
    let observer = null;
    if (typeof window.IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          parked = entry.intersectionRatio < 0.12;
          el.classList.toggle("hero--parked", parked);
        },
        { threshold: [0, 0.12] }
      );
      observer.observe(el);
    }

    if (finePointer) {
      el.addEventListener("pointermove", onMove, { passive: true });
      el.addEventListener("pointerleave", resetTilt);
      el.addEventListener("pointercancel", resetTilt);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      if (moveFrame) cancelAnimationFrame(moveFrame);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      observer?.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", resetTilt);
      el.removeEventListener("pointercancel", resetTilt);
      window.removeEventListener("scroll", onScroll);
      el.classList.remove("hero--parked");
      el.style.removeProperty("--hero-mx");
      el.style.removeProperty("--hero-my");
      el.style.removeProperty("--hero-scroll");
    };
  }, []);

  return (
    <section id="home" className="hero" ref={rootRef}>
      <div className="hero__bg" aria-hidden="true">
        <img src="/images/hero-main.jpg" alt="" fetchpriority="high" />
        <div className="hero__overlay" />
      </div>

      {/* Decorative 3D scene — hidden from assistive tech, hidden on small screens */}
      <div className="hero__scene" aria-hidden="true">
        <span className="hero__glow hero__glow--a" />
        <span className="hero__glow hero__glow--b" />

        <div className="hero__disc-pos">
          <div className="hero__disc-par">
            <div className="hero__disc-float">
              <span className="hero__disc-ring" />
              <span className="hero__disc-ring hero__disc-ring--2" />
              <div className="hero__disc-face">
                <img src="/images/pizza-4.jpg" alt="" decoding="async" />
                <span className="hero__disc-shine" />
              </div>
            </div>
          </div>
        </div>

        <div className="hero__tile hero__tile--burger">
          <div className="hero__tile-par">
            <div className="hero__tile-float hero__tile-float--a">
              <img src="/images/burger-1.jpg" alt="" loading="lazy" decoding="async" />
              <span>Burgers</span>
            </div>
          </div>
        </div>

        <div className="hero__tile hero__tile--broast">
          <div className="hero__tile-par">
            <div className="hero__tile-float hero__tile-float--b">
              <img src="/images/broast-1.jpg" alt="" loading="lazy" decoding="async" />
              <span>Broast</span>
            </div>
          </div>
        </div>

        <div className="hero__chip-pos">
          <div className="hero__chip">🍕 Pizza · Burgers · Broast</div>
        </div>
      </div>

      <div className="container hero__content">
        <p className="hero__eyebrow">
          <span className="hero__pulse" aria-hidden="true" />
          {siteInfo.addressLine}, {siteInfo.city}
        </p>

        <h1 className="hero__title">
          Big Bites.
          <br />
          <span className="text-gold">Bold Flavours.</span>
        </h1>

        <p className="hero__subtitle">
          Freshly baked pizzas, crispy burgers, broast, wraps and more — served hot from
          our kitchen in Mardan. Build your order online and send it straight to us on WhatsApp.
        </p>

        <div className="hero__actions">
          <a href="#menu" className="btn btn--gold btn--lg">
            Order Now
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
          <a href="#popular" className="btn btn--ghost btn--lg">
            Explore Menu
          </a>
        </div>

        {offerStatus.active && (
          <a href="#menu" className="hero__offer-chip">
            🔥 {offerConfig.discountPercent}% OFF — {offerConfig.title}
          </a>
        )}

        <div className="hero__meta">
          <div className="hero__meta-item">
            <strong>📱 {siteInfo.phoneDisplay}</strong>
            <span>Call to order</span>
          </div>
          <div className="hero__meta-divider" aria-hidden="true" />
          <div className="hero__meta-item">
            <strong>🛵 Delivery & Pickup</strong>
            <span>Order on WhatsApp</span>
          </div>
          <div className="hero__meta-divider" aria-hidden="true" />
          <div className="hero__meta-item">
            <strong>🍕 Pizza · Burgers · Broast</strong>
            <span>Made fresh daily</span>
          </div>
        </div>
      </div>

      <div className="hero__scroll-hint" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
