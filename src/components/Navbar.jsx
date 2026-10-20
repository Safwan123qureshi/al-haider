import { useEffect, useRef, useState } from "react";
import Logo from "./Logo.jsx";
import { useCart } from "../context/CartContext.jsx";

const LINKS = [
  { href: "#home", label: "Home" },
  { href: "#menu", label: "Menu" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const { itemCount, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("home");
  const headerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      // Scroll-progress line — written straight to CSS, no re-render.
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      headerRef.current?.style.setProperty(
        "--nav-progress",
        max > 0 ? String(Math.min(1, window.scrollY / max)) : "0"
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the link of the section currently under the navbar.
  useEffect(() => {
    if (typeof window.IntersectionObserver === "undefined") return undefined;
    const map = { home: "home", popular: "menu", menu: "menu", about: "about", contact: "contact" };
    const sections = Object.keys(map)
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        visible.sort(
          (a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top)
        );
        setActive(map[visible[0].target.id] || "home");
      },
      { rootMargin: "-38% 0px -54% 0px", threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`} ref={headerRef}>
      <div className="navbar__inner container">
        <a href="#home" className="navbar__brand" onClick={closeMenu} aria-label="Al Haider Pizza House — home">
          <Logo size={42} />
        </a>

        <nav className={`navbar__links ${menuOpen ? "navbar__links--open" : ""}`} aria-label="Main navigation">
          {LINKS.map((link) => {
            const isActive = active === link.href.slice(1);
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={isActive ? "is-active" : undefined}
                aria-current={isActive ? "location" : undefined}
              >
                {link.label}
              </a>
            );
          })}
          <a href="#contact" className="navbar__phone-mobile" onClick={closeMenu}>
            📞 0339-5509755
          </a>
        </nav>

        <div className="navbar__actions">
          <a href="tel:+923395509755" className="navbar__call" aria-label="Call Al Haider Pizza House">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.66 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.31 1.85.53 2.81.66A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>0339-5509755</span>
          </a>

          <button type="button" className="navbar__cart" onClick={openCart} aria-label={`Open cart, ${itemCount} items`}>
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1.4" />
              <circle cx="19" cy="21" r="1.4" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {/* key = count → the badge remounts so its pop animation replays */}
            {itemCount > 0 && (
              <span key={itemCount} className="navbar__badge">
                {itemCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`navbar__burger ${menuOpen ? "is-open" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      <span className="navbar__progress" aria-hidden="true" />
    </header>
  );
}
