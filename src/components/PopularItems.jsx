import MenuCard from "./MenuCard.jsx";
import { availableItems } from "../data/menu.js";

/** Featured items — every menu item with `featured: true`. */
export default function PopularItems() {
  const featured = availableItems.filter((item) => item.featured).slice(0, 8);
  if (!featured.length) return null;

  return (
    <section id="popular" className="section popular-section">
      <div className="container">
        <div className="section-head" data-reveal>
          <p className="section-head__eyebrow">Customer Favourites</p>
          <h2 className="section-head__title">
            Popular <span className="text-gold">Right Now</span>
          </h2>
          <p className="section-head__sub">
            The burgers, pizzas, fries and wraps our Mardan customers keep coming back for.
          </p>
        </div>

        <div className="menu-grid menu-grid--popular" data-reveal-grid>
          {featured.map((item, i) => (
            <MenuCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
