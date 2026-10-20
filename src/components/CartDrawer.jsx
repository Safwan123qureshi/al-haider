import { useEffect, useState } from "react";
import FoodImage from "./FoodImage.jsx";
import CheckoutForm from "./CheckoutForm.jsx";
import { useCart } from "../context/CartContext.jsx";
import { formatPKR } from "../utils/pricing.js";
import { offerConfig } from "../data/offer.js";

/**
 * Slide-in cart drawer. Shows live totals (discount-aware), quantity
 * controls, and switches to the checkout form on demand.
 */
export default function CartDrawer() {
  const {
    lines, summary, offerStatus, isCartOpen, closeCart,
    setQuantity, removeItem,
  } = useCart();
  const [stage, setStage] = useState("cart"); // "cart" | "checkout"

  // Return to the cart view whenever the drawer is (re)opened.
  useEffect(() => {
    if (isCartOpen) setStage("cart");
  }, [isCartOpen]);

  // Lock page scroll while open.
  useEffect(() => {
    document.body.style.overflow = isCartOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isCartOpen]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && isCartOpen) closeCart(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCartOpen, closeCart]);

  const gotoMenu = () => {
    closeCart();
    window.setTimeout(() => {
      document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
    }, 120);
  };

  return (
    <>
      <div
        className={`cart-overlay ${isCartOpen ? "is-open" : ""}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      <aside
        className={`cart-drawer ${isCartOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!isCartOpen}
      >
        <header className="cart-drawer__head">
          <div>
            <h2>{stage === "checkout" ? "Checkout" : "Your Order"}</h2>
            <p>
              {summary.itemCount} item{summary.itemCount === 1 ? "" : "s"}
              {offerStatus.active && summary.hasDiscount && (
                <> · <span className="text-gold">🔥 {offerConfig.discountPercent}% OFF applied</span></>
              )}
            </p>
          </div>
          <button type="button" className="cart-drawer__close" onClick={closeCart} aria-label="Close cart">
            ✕
          </button>
        </header>

        {/* The checkout stage renders even with an empty cart: after a
            successful WhatsApp checkout the cart is cleared, but the result
            panel (with the preserved order message) must stay on screen. */}
        {stage === "checkout" ? (
          <CheckoutForm onBack={() => setStage("cart")} onDone={() => setStage("cart")} />
        ) : summary.lines.length === 0 ? (
          <div className="cart-empty">
            <span aria-hidden="true">🛒</span>
            <h3>Your cart is empty</h3>
            <p>Add something delicious from the menu to get started.</p>
            <button type="button" className="btn btn--gold" onClick={gotoMenu}>
              Browse Full Menu
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {summary.lines.map((line) => (
                <CartRow key={line.key} line={line} onQty={setQuantity} onRemove={removeItem} />
              ))}
            </div>
            <CartFooter summary={summary} offerStatus={offerStatus} onCheckout={() => setStage("checkout")} onContinue={gotoMenu} />
          </>
        )}
      </aside>
    </>
  );
}

function CartRow({ line, onQty, onRemove }) {
  return (
    <div className="cart-item">
      <div className="cart-item__media">
        <FoodImage src={line.item.image} alt={line.item.name} category={line.item.category} />
      </div>
      <div className="cart-item__info">
        <div className="cart-item__top">
          <h4>
            {line.item.name}
            {line.sizeLabel && <em> · {line.sizeLabel}</em>}
          </h4>
          <button
            type="button"
            className="cart-item__remove"
            onClick={() => onRemove(line.id, line.size)}
            aria-label={`Remove ${line.item.name}`}
          >
            🗑
          </button>
        </div>
        <p className="cart-item__unit">
          {line.pricing.onOffer ? (
            <>
              <s>{formatPKR(line.pricing.original)}</s>{" "}
              <strong>{formatPKR(line.pricing.discounted)}</strong> each
            </>
          ) : (
            <>{formatPKR(line.pricing.original)} each</>
          )}
        </p>
        <div className="cart-item__bottom">
          <div className="qty-control">
            <button type="button" onClick={() => onQty(line.id, line.size, line.quantity - 1)} aria-label="Decrease quantity">−</button>
            <span aria-live="polite">{line.quantity}</span>
            <button type="button" onClick={() => onQty(line.id, line.size, line.quantity + 1)} aria-label="Increase quantity">+</button>
          </div>
          <strong className="cart-item__subtotal">
            {formatPKR(line.pricing.onOffer ? line.payableSubtotal : line.originalSubtotal)}
          </strong>
        </div>
      </div>
    </div>
  );
}

function CartFooter({ summary, offerStatus, onCheckout, onContinue }) {
  return (
    <footer className="cart-drawer__foot">
      <div className="cart-totals">
        <div className="cart-totals__row">
          <span>Subtotal</span>
          <span>{formatPKR(summary.originalSubtotal)}</span>
        </div>
        {summary.hasDiscount && (
          <div className="cart-totals__row cart-totals__row--discount">
            <span>Discount ({offerStatus.discountPercent}%)</span>
            <span>− {formatPKR(summary.discountTotal)}</span>
          </div>
        )}
        <div className="cart-totals__row cart-totals__row--total">
          <span>Total Payable</span>
          <strong>{formatPKR(summary.payableTotal)}</strong>
        </div>
        {summary.hasDiscount && (
          <p className="cart-totals__savings">
            🎉 You save {formatPKR(summary.discountTotal)} on this order
          </p>
        )}
      </div>

      <div className="cart-drawer__actions">
        <button type="button" className="btn btn--ghost-dark" onClick={onContinue}>
          Continue Shopping
        </button>
        <button type="button" className="btn btn--gold" onClick={onCheckout}>
          Checkout →
        </button>
      </div>
    </footer>
  );
}
