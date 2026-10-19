import { offerConfig } from "../data/offer.js";
import { isItemDiscountEligible } from "./offerStatus.js";

/** Round a payable monetary amount to the nearest whole Pakistani rupee. */
export function roundRupees(amount) {
  return Math.round(Number(amount) || 0);
}

/** Format an amount as "Rs. 1,200" (PKR, thousands separated, no decimals). */
export function formatPKR(amount) {
  const value = roundRupees(amount);
  const negative = value < 0;
  const abs = Math.abs(value).toString();
  let grouped = "";
  for (let i = 0; i < abs.length; i += 1) {
    if (i > 0 && (abs.length - i) % 3 === 0) grouped += ",";
    grouped += abs[i];
  }
  return `${negative ? "-" : ""}Rs. ${grouped}`;
}

/** Read the original (never-discounted) unit price for an item + optional size. */
export function getOriginalUnitPrice(item, sizeId = null) {
  if (!item) return 0;
  if (item.sizes && item.sizes.length) {
    const size = item.sizes.find((s) => s.id === sizeId) || item.sizes[0];
    return Number(size.price) || 0;
  }
  return Number(item.price) || 0;
}

/**
 * Resolve the label of a selected pizza size ("Small" / "Medium" / "Large"),
 * or null for regular (non-sized) items.
 */
export function getSizeLabel(item, sizeId = null) {
  if (!item || !item.sizes || !item.sizes.length) return null;
  const size = item.sizes.find((s) => s.id === sizeId) || item.sizes[0];
  return size.label || null;
}

/**
 * Unit price breakdown for one item (one size) at the current offer state.
 * Original menu prices are NEVER mutated — the discount is always derived.
 */
export function getPricing(item, sizeId = null, offerStatus = null, config = offerConfig) {
  const original = getOriginalUnitPrice(item, sizeId);
  const eligible = isItemDiscountEligible(item, offerStatus, config);
  if (eligible && offerStatus.active) {
    const factor = 1 - (offerStatus.discountPercent || config.discountPercent || 0) / 100;
    const discounted = roundRupees(original * factor);
    return {
      original,
      discounted,
      savings: roundRupees(original - discounted),
      onOffer: true,
      discountPercent: offerStatus.discountPercent || config.discountPercent,
    };
  }
  return { original, discounted: original, savings: 0, onOffer: false, discountPercent: 0 };
}

/**
 * Compute the cart summary (all amounts rounded to whole rupees).
 * @param {Array<{item: object, size: string|null, quantity: number}>} lines
 * @param {object|null} offerStatus result of getOfferStatus()
 * @returns {{lines, originalSubtotal, discountTotal, payableTotal, itemCount, hasDiscount}}
 */
export function computeCartSummary(lines = [], offerStatus = null, config = offerConfig) {
  const detailed = lines
    .filter((line) => line && line.item)
    .map((line) => {
      const quantity = Math.max(1, parseInt(line.quantity, 10) || 1);
      const pricing = getPricing(line.item, line.size, offerStatus, config);
      const originalSubtotal = roundRupees(pricing.original * quantity);
      const payableSubtotal = roundRupees(pricing.discounted * quantity);
      return {
        ...line,
        quantity,
        pricing,
        sizeLabel: getSizeLabel(line.item, line.size),
        originalSubtotal,
        payableSubtotal,
        lineSavings: roundRupees(originalSubtotal - payableSubtotal),
      };
    });

  const originalSubtotal = roundRupees(detailed.reduce((sum, l) => sum + l.originalSubtotal, 0));
  const payableTotal = roundRupees(detailed.reduce((sum, l) => sum + l.payableSubtotal, 0));
  const discountTotal = roundRupees(originalSubtotal - payableTotal);
  const itemCount = detailed.reduce((sum, l) => sum + l.quantity, 0);

  return {
    lines: detailed,
    originalSubtotal,
    payableTotal,
    discountTotal,
    itemCount,
    hasDiscount: discountTotal > 0,
  };
}
