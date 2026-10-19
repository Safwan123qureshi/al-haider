import { useState } from "react";
import FoodImage from "./FoodImage.jsx";
import { useCart } from "../context/CartContext.jsx";
import { getPricing, formatPKR } from "../utils/pricing.js";
import { getCategory } from "../data/menu.js";
import { offerConfig } from "../data/offer.js";

/**
 * One menu card. Handles pizza size selection, live pricing
 * (discount-aware) and Add to Cart.
 */
export default function MenuCard({ item }) {
  const { addItem, offerStatus } = useCart();
  const [sizeId, setSizeId] = useState(() =>
    item.sizes ? (item.sizes.find((s) => s.price != null) || item.sizes[0]).id : null
  );
  const [added, setAdded] = useState(false);

  const category = getCategory(item.category);
  const isPizza = Boolean(item.sizes && item.sizes.length);
  const selectedSize = isPizza ? item.sizes.find((s) => s.id === sizeId) : null;
  const sizeUnavailable = Boolean(isPizza && (selectedSize?.price == null));
  const pricing = getPricing(item, sizeId, offerStatus, offerConfig);
  const unavailable = item.available === false || sizeUnavailable;

  const handleAdd = () => {
    if (unavailable) return;
    addItem(item, isPizza ? sizeId : null, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className={`menu-card ${unavailable ? "menu-card--unavailable" : ""}`}>
      <div className="menu-card__media">
        <FoodImage src={item.image} alt={item.name} category={item.category} />
        {pricing.onOffer && !unavailable && (
          <span className="menu-card__badge">{offerConfig.discountPercent}% OFF</span>
        )}
        {item.featured && !pricing.onOffer && <span className="menu-card__badge menu-card__badge--dark">POPULAR</span>}
        <span className="menu-card__category">{category.icon} {category.name}</span>
      </div>

      <div className="menu-card__body">
        <h3 className="menu-card__title">{item.name}</h3>
        <p className="menu-card__desc">{item.description}</p>

        {isPizza && (
          <div className="menu-card__sizes" role="group" aria-label={`Choose size for ${item.name}`}>
            {item.sizes.map((size) => {
              const disabled = size.price == null;
              return (
                <button
                  key={size.id}
                  type="button"
                  disabled={disabled}
                  title={disabled ? "Coming soon — price to be confirmed" : `${size.label} — ${formatPKR(size.price)}`}
                  className={`size-pill ${sizeId === size.id ? "is-active" : ""}`}
                  onClick={() => setSizeId(size.id)}
                >
                  <span>{size.label}</span>
                  <strong>{disabled ? "—" : formatPKR(size.price)}</strong>
                </button>
              );
            })}
          </div>
        )}

        <div className="menu-card__footer">
          <div className="menu-card__price">
            {pricing.onOffer ? (
              <>
                <s>{formatPKR(pricing.original)}</s>
                <strong>{formatPKR(pricing.discounted)}</strong>
              </>
            ) : (
              <strong>{sizeUnavailable ? "Price TBA" : formatPKR(pricing.original)}</strong>
            )}
          </div>

          <button
            type="button"
            className={`btn btn--gold btn--card ${added ? "is-added" : ""}`}
            onClick={handleAdd}
            disabled={unavailable}
            aria-label={`Add ${item.name} to cart`}
          >
            {unavailable ? (
              "Coming Soon"
            ) : added ? (
              <>✓ Added</>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
