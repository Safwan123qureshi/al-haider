import { categories } from "../data/menu.js";

/**
 * Horizontal category filter chips (auto-generated from menu data).
 * Controlled component: value + onChange from the parent (MenuSection).
 */
export default function CategoryFilter({ value, onChange, counts = {} }) {
  const chips = [{ id: "all", name: "All Items", icon: "✨" }, ...categories];

  return (
    <div className="cat-filter" role="tablist" aria-label="Menu categories">
      {chips.map((cat) => {
        const active = value === cat.id;
        const count = cat.id === "all" ? counts.all : counts[cat.id];
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`cat-filter__chip ${active ? "is-active" : ""}`}
            onClick={() => onChange(cat.id)}
          >
            <span aria-hidden="true">{cat.icon}</span>
            {cat.name}
            {typeof count === "number" && <em>{count}</em>}
          </button>
        );
      })}
    </div>
  );
}
