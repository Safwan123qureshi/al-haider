import { CartProvider, useCart } from "./context/CartContext.jsx";
import useReveal from "./hooks/useReveal.js";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import OfferBanner from "./components/OfferBanner.jsx";
import PopularItems from "./components/PopularItems.jsx";
import MenuSection from "./components/MenuSection.jsx";
import About from "./components/About.jsx";
import WhyChooseUs from "./components/WhyChooseUs.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import { availableItems, categories } from "./data/menu.js";

function Page() {
  const { isCartOpen } = useCart();
  // Enables scroll-reveal animations (premium.css). Falls back to showing
  // everything immediately when IO is unavailable or motion is reduced.
  useReveal();

  return (
    <div className={`page ${isCartOpen ? "page--cart-open" : ""}`}>
      <Navbar />
      <main>
        <Hero />
        <OfferBanner />
        <PopularItems />
        <MenuSection />
        <About />
        <WhyChooseUs itemCount={availableItems.length} categoryCount={categories.length} />
        <Contact />
      </main>
      <Footer />
      <CartDrawer />

      {/* Direct WhatsApp floating action button — always reachable on mobile */}
      <a
        className="fab-whatsapp"
        href="https://wa.me/923395509755?text=Assalam-o-Alaikum!%20I%20would%20like%20to%20place%20an%20order%20from%20Al%20Haider%20Pizza%20House."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Order on WhatsApp"
      >
        <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true">
          <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.3.7 4.5 1.9 6.4L4 29l7-1.8c1.8 1 3.9 1.5 6 1.5h.1c6.6 0 12-5.3 12-11.9C29.1 8.3 22.6 3 16 3zm5.9 16.9c-.3.8-1.6 1.5-2.2 1.6-.6.1-1.3.1-2.1-.1-.5-.2-1.1-.4-1.9-.7-3.4-1.5-5.6-4.9-5.8-5.1-.2-.2-1.5-2-1.5-3.8s1-2.7 1.3-3.1c.3-.4.7-.5 1-.5h.7c.2 0 .5-.1.8.6.3.8 1.1 2.6 1.2 2.8.1.2.2.4 0 .7-.1.2-.2.4-.4.6l-.6.7c-.2.2-.4.4-.2.8.2.4 1 1.7 2.2 2.7 1.5 1.4 2.8 1.8 3.2 2 .4.2.6.2.9-.1.3-.4 1.1-1.3 1.4-1.8.3-.4.6-.4.9-.2.4.1 2.2 1 2.6 1.2.4.2.6.3.7.5.1.2.1 1-.4 1.8z" />
        </svg>
      </a>
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Page />
    </CartProvider>
  );
}
