import FoodImage from "./FoodImage.jsx";
import { availableItems, categories } from "../data/menu.js";
import { siteInfo } from "../data/site.js";

export default function About() {
  return (
    <section id="about" className="section about-section">
      <div className="container about-grid">
        <div className="about-media" data-reveal>
          <div className="about-media__main">
            <FoodImage src="/images/about-1.jpg" alt="Guests dining at a warm, modern restaurant" category="pizza" />
          </div>
          <div className="about-media__secondary">
            <FoodImage src="/images/kitchen-1.jpg" alt="Fresh food being prepared in the kitchen" category="burger" />
          </div>
          <div className="about-media__card">
            <strong>{availableItems.length}+</strong>
            <span>menu items &amp; counting</span>
          </div>
        </div>

        <div className="about-copy" data-reveal style={{ "--reveal-delay": "0.12s" }}>
          <p className="section-head__eyebrow">About Us</p>
          <h2 className="section-head__title">
            Mardan's Local <span className="text-gold">Fast-Food</span> Kitchen
          </h2>
          <p>
            Al Haider Pizza House is a local fast-food restaurant located opposite UET at
            Charsadda Chowk, Mardan. We serve freshly prepared pizzas, burgers, broast,
            wraps, wings, pasta, fries and more — cooked to order and packed with flavour.
          </p>
          <p>
            Whether you are grabbing a quick bite with friends, feeding the whole family,
            or ordering in for study nights at UET, our kitchen puts the same care into
            every order. Call us, message on WhatsApp, or build your order right here on
            the website — delivery or pickup, it is your call.
          </p>

          <div className="about-stats">
            <div className="about-stat">
              <strong>{availableItems.length}+</strong>
              <span>Menu Items</span>
            </div>
            <div className="about-stat">
              <strong>{categories.length}</strong>
              <span>Food Categories</span>
            </div>
            <div className="about-stat">
              <strong>S·M·L</strong>
              <span>Pizza Sizes</span>
            </div>
            <div className="about-stat">
              <strong>{siteInfo.city}</strong>
              <span>Charsadda Chowk</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
