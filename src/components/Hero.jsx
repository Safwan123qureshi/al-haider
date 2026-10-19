import { useCart } from "../context/CartContext.jsx";
import { offerConfig } from "../data/offer.js";
import { siteInfo } from "../data/site.js";

export default function Hero() {
  const { offerStatus } = useCart();

  return (
    <section id="home" className="hero">
      <div className="hero__bg" aria-hidden="true">
        <img src="/images/hero-main.jpg" alt="" fetchpriority="high" />
        <div className="hero__overlay" />
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
