import { siteInfo } from "../data/site.js";

export default function Contact() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(siteInfo.mapQuery)}&z=15&output=embed`;

  return (
    <section id="contact" className="section contact-section">
      <div className="container">
        <div className="section-head" data-reveal>
          <p className="section-head__eyebrow">Contact &amp; Location</p>
          <h2 className="section-head__title">
            Ready When <span className="text-gold">You Are</span>
          </h2>
          <p className="section-head__sub">
            Call us, send your order on WhatsApp, or visit us at Charsadda Chowk, Mardan.
          </p>
        </div>

        <div className="contact-grid">
          <div className="contact-cards" data-reveal-grid>
            <a className="contact-card" href={siteInfo.phoneHref} style={{ "--i": "0" }}>
              <div className="contact-card__icon" aria-hidden="true">📞</div>
              <div>
                <span>Call Us</span>
                <strong>{siteInfo.phoneDisplay}</strong>
              </div>
            </a>

            <a
              className="contact-card contact-card--whatsapp"
              href={`${siteInfo.whatsappLink}?text=${encodeURIComponent("Assalam-o-Alaikum! I would like to place an order from Al Haider Pizza House.")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ "--i": "1" }}
            >
              <div className="contact-card__icon" aria-hidden="true">💬</div>
              <div>
                <span>WhatsApp Ordering</span>
                <strong>Send us your order</strong>
              </div>
            </a>

            <a
              className="contact-card"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteInfo.mapQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ "--i": "2" }}
            >
              <div className="contact-card__icon" aria-hidden="true">📍</div>
              <div>
                <span>Visit Us</span>
                <strong>{siteInfo.addressLine}, {siteInfo.city}, {siteInfo.country}</strong>
              </div>
            </a>

            <a className="contact-card contact-card--order" href="#menu" style={{ "--i": "3" }}>
              <div className="contact-card__icon" aria-hidden="true">🛒</div>
              <div>
                <span>Build Your Order</span>
                <strong>Open the full menu</strong>
              </div>
            </a>
          </div>

          <div className="contact-map" data-reveal style={{ "--reveal-delay": "0.15s" }}>
            <iframe
              title="Al Haider Pizza House location map"
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
