import Logo from "./Logo.jsx";
import { siteInfo } from "../data/site.js";

const LINKS = [
  { href: "#home", label: "Home" },
  { href: "#menu", label: "Menu" },
  { href: "#popular", label: "Popular" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo size={46} />
          <p>
            Big bites, bold flavours — freshly made pizza, burgers, broast and more,
            served from {siteInfo.city}.
          </p>
        </div>

        <div className="footer__col">
          <h4>Quick Links</h4>
          <nav aria-label="Footer navigation">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </nav>
        </div>

        <div className="footer__col">
          <h4>Contact</h4>
          <a href={siteInfo.phoneHref}>📞 {siteInfo.phoneDisplay}</a>
          <a href={siteInfo.whatsappLink} target="_blank" rel="noopener noreferrer">💬 WhatsApp Order</a>
          <p>📍 {siteInfo.addressLine},<br />{siteInfo.city}, {siteInfo.country}</p>
        </div>

        <div className="footer__col">
          <h4>Order Now</h4>
          <p>Your order is confirmed after you press Send on WhatsApp.</p>
          <a
            className="btn btn--gold btn--sm"
            href={`${siteInfo.whatsappLink}?text=${encodeURIComponent("Assalam-o-Alaikum! I would like to place an order from Al Haider Pizza House.")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Order on WhatsApp
          </a>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>© {new Date().getFullYear()} {siteInfo.name}. All rights reserved.</p>
          <p>Made with 🔥 in Mardan</p>
        </div>
      </div>
    </footer>
  );
}
