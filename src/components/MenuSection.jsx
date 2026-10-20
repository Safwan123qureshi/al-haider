import { useMemo, useState } from "react";
import MenuCard from "./MenuCard.jsx";
import CategoryFilter from "./CategoryFilter.jsx";
import { availableItems, categories } from "../data/menu.js";

/**
 * Full menu: search + category filter + responsive card grid.
 * Entirely data-driven — new items in src/data/menu.js appear automatically.
 */
export default function MenuSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const counts = useMemo(() => {
    const map = { all: availableItems.length };
    categories.forEach((cat) => {
      map[cat.id] = availableItems.filter((i) => i.category === cat.id).length;
    });
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return availableItems.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <section id="menu" className="section menu-section">
      <div className="container">
        <div className="section-head" data-reveal>
          <p className="section-head__eyebrow">Our Menu</p>
          <h2 className="section-head__title">
            Everything You <span className="text-gold">Crave</span>, One Place
          </h2>
          <p className="section-head__sub">
            Search, pick your favourite, and add it to your order — prices in Pakistani Rupees.
          </p>
        </div>

        <div className="menu-toolbar">
          <div className="search-box">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pizza, burger, wings…"
              aria-label="Search menu items"
            />
            {query && (
              <button type="button" className="search-box__clear" onClick={() => setQuery("")} aria-label="Clear search">
                ✕
              </button>
            )}
          </div>
          <p className="menu-toolbar__count" aria-live="polite">
            {filtered.length} item{filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        <CategoryFilter value={category} onChange={setCategory} counts={counts} />

        {filtered.length > 0 ? (
          <div className="menu-grid" data-reveal-grid>
            {filtered.map((item, i) => (
              <MenuCard key={item.id} item={item} index={i} />
            ))}
          </div>
        ) : (
          <div className="menu-empty">
            <span aria-hidden="true">🍽️</span>
            <h3>No items found</h3>
            <p>Try a different search word or pick another category.</p>
            <button
              type="button"
              className="btn btn--gold"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
            >
              Show Full Menu
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
