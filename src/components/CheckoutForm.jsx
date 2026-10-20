import { useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { computeCartSummary, formatPKR } from "../utils/pricing.js";
import { getMenuItem } from "../data/menu.js";
import { offerConfig } from "../data/offer.js";
import { buildOrderMessage, openWhatsApp, buildWhatsAppLink } from "../utils/whatsapp.js";
import { siteInfo } from "../data/site.js";

const PHONE_RE = /^(\+92|0)?3\d{2}[\s-]?\d{7}$/;

/**
 * Checkout form. No online payment — the customer confirms the order
 * by sending a pre-filled WhatsApp message to the restaurant.
 */
export default function CheckoutForm({ onBack }) {
  const { lines, summary, offerStatus, refreshOffer, clearCart } = useCart();
  const [form, setForm] = useState({
    name: "", phone: "", orderType: "Delivery", address: "", instructions: "",
  });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null); // { ok, url?, message }

  const setField = (key) => (e) => {
    const value = e.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined, form: undefined }));
  };

  const validate = () => {
    const er = {};
    if (form.name.trim().length < 2) er.name = "Please enter your full name.";
    if (!PHONE_RE.test(form.phone.trim())) {
      er.phone = "Enter a valid mobile number, e.g. 0339-5509755.";
    }
    if (form.orderType === "Delivery" && form.address.trim().length < 8) {
      er.address = "Please enter your delivery address.";
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // 1) Recheck the offer status at this exact moment.
    const currentOffer = refreshOffer();

    // 2) Recalculate everything from original menu data (never stored prices).
    const freshLines = lines
      .map((l) => ({ item: getMenuItem(l.id), size: l.size, quantity: l.quantity }))
      .filter((l) => l.item);
    const freshSummary = computeCartSummary(freshLines, currentOffer, offerConfig);

    // An order with nothing in it is invalid — never open WhatsApp for it
    // (and, per the flow below, the cart is only ever cleared for a valid
    // order whose WhatsApp destination actually opened).
    if (freshSummary.lines.length === 0) {
      setErrors({ form: "Your cart is empty — add something from the menu first." });
      return;
    }

    // 3) Build the readable order message.
    const message = buildOrderMessage({
      summaryLines: freshSummary.lines,
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        orderType: form.orderType,
        address: form.address.trim(),
        instructions: form.instructions,
      },
      summary: freshSummary,
      offerStatus: currentOffer,
    });

    // 4) Open WhatsApp (customer must press Send).
    const res = openWhatsApp(message);
    if (res.ok) {
      // The WhatsApp destination opened with the order message prepared, so
      // the website cart is cleared NOW — state, badge, totals and the
      // persisted copy in localStorage all reset together. The generated
      // message stays preserved in the result panel below so the customer can
      // still review, copy or resend it. NOTE: this does NOT mean the order
      // was sent or received — the customer still has to press Send in
      // WhatsApp.
      setResult({ ok: true, message, url: res.url });
      clearCart();
    } else {
      // WhatsApp never opened (popup blocked / failed) — keep the cart so
      // nothing is lost; the customer can open WhatsApp manually below.
      setResult({ ok: false, url: res.url, message });
    }
  };

  if (result) {
    return (
      <div className="checkout-result">
        <span className="checkout-result__icon" aria-hidden="true">
          {result.ok ? "✅" : "⚠️"}
        </span>
        <h3>{result.ok ? "WhatsApp is opening…" : "We could not open WhatsApp"}</h3>
        <p>
          {result.ok
            ? `Your order message is ready in WhatsApp — press Send there to place the order. It is not confirmed until you send it, and ${siteInfo.name} has not received it yet.`
            : "Your browser blocked the new tab. Use the button below to open WhatsApp manually — your order message is ready and your cart is still saved."}
        </p>
        {result.ok && (
          <p className="checkout-result__note">🛒 Your website cart has been cleared for the new order.</p>
        )}
        <a
          className="btn btn--gold btn--block"
          href={result.url || buildWhatsAppLink(result.message)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            // Manual fallback: this anchor click IS the action that opens
            // WhatsApp (target=_blank from a direct user gesture is never
            // popup-blocked), so the cart is cleared here as well.
            if (!result.ok) clearCart();
          }}
        >
          Open WhatsApp & Send Order
        </a>
        <details className="checkout-result__details">
          <summary>View / copy your order message</summary>
          <textarea readOnly value={result.message} rows="10" aria-label="Order message" />
          <button
            type="button"
            className="btn btn--ghost-dark btn--sm"
            onClick={() => navigator.clipboard?.writeText(result.message)}
          >
            Copy Message
          </button>
        </details>
        <div className="checkout-result__actions">
          {result.ok ? (
            <button type="button" className="btn btn--gold btn--block" onClick={onBack}>
              Done — Back to Cart
            </button>
          ) : (
            <>
              <button type="button" className="btn btn--ghost-dark" onClick={() => setResult(null)}>
                ← Back to form
              </button>
              <button
                type="button"
                className="btn btn--gold"
                onClick={() => { clearCart(); setResult(null); onBack(); }}
              >
                Start New Order
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="checkout-form" onSubmit={handleSubmit} noValidate>
      <button type="button" className="checkout-form__back" onClick={onBack}>
        ← Back to cart
      </button>

      <div className="form-field">
        <label htmlFor="co-name">Your Name *</label>
        <input
          id="co-name" type="text" value={form.name} onChange={setField("name")}
          placeholder="e.g. Ahmed Khan" autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "co-name-error" : undefined}
        />
        {errors.name && <p id="co-name-error" className="form-error">{errors.name}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="co-phone">Phone Number *</label>
        <input
          id="co-phone" type="tel" value={form.phone} onChange={setField("phone")}
          placeholder="03XX-XXXXXXX" autoComplete="tel" inputMode="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "co-phone-error" : undefined}
        />
        {errors.phone && <p id="co-phone-error" className="form-error">{errors.phone}</p>}
      </div>

      <fieldset className="form-field">
        <legend>Order Type *</legend>
        <div className="order-type">
          {["Delivery", "Pickup"].map((type) => (
            <label key={type} className={`order-type__option ${form.orderType === type ? "is-active" : ""}`}>
              <input
                type="radio" name="orderType" value={type}
                checked={form.orderType === type}
                onChange={setField("orderType")}
              />
              {type === "Delivery" ? "🛵 Delivery" : "🏪 Pickup"}
            </label>
          ))}
        </div>
      </fieldset>

      {form.orderType === "Delivery" && (
        <div className="form-field">
          <label htmlFor="co-address">Delivery Address *</label>
          <input
            id="co-address" type="text" value={form.address} onChange={setField("address")}
            placeholder="House, street, area, Mardan" autoComplete="street-address"
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? "co-address-error" : undefined}
          />
          {errors.address && <p id="co-address-error" className="form-error">{errors.address}</p>}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="co-notes">Special Instructions <span>(optional)</span></label>
        <textarea
          id="co-notes" rows="2" value={form.instructions} onChange={setField("instructions")}
          placeholder="Less spicy, extra sauce, call on arrival…"
        />
      </div>

      <div className="checkout-summary">
        <div className="cart-totals__row">
          <span>Subtotal</span><span>{formatPKR(summary.originalSubtotal)}</span>
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
      </div>

      <p className="checkout-note">
        Your order is confirmed only after you press <strong>Send</strong> in WhatsApp.
        No online payment is required — pay on delivery or pickup.
      </p>

      {errors.form && <p className="form-error">{errors.form}</p>}

      <button type="submit" className="btn btn--gold btn--block btn--lg">
        Confirm Order on WhatsApp
      </button>
    </form>
  );
}
