import { offerConfig } from "../data/offer.js";
import { siteInfo } from "../data/site.js";
import { formatPKR } from "./pricing.js";

const WHATSAPP_NUMBER = siteInfo.whatsappNumber;

/**
 * Build the WhatsApp order message text.
 * Prices are passed in as a summary produced by computeCartSummary()
 * so the message always matches the totals shown to the customer.
 *
 * @param {object} params
 * @param {Array}  params.summaryLines detailed lines from computeCartSummary()
 * @param {object} params.customer { name, phone, orderType, address, instructions }
 * @param {object} params.summary   full summary from computeCartSummary()
 * @param {object} params.offerStatus current result of getOfferStatus()
 */
export function buildOrderMessage({ summaryLines, customer, summary, offerStatus }) {
  const lines = [];
  lines.push("AL HAIDER PIZZA HOUSE — NEW ORDER");
  lines.push("");
  lines.push(`Customer Name: ${customer.name}`);
  lines.push(`Customer Phone: ${customer.phone}`);
  lines.push(`Order Type: ${customer.orderType}`);
  if (customer.orderType === "Delivery") {
    lines.push(`Delivery Address: ${customer.address}`);
  }
  lines.push("");
  lines.push("ORDER ITEMS:");
  summaryLines.forEach((line) => {
    const sizePart = line.sizeLabel ? ` (${line.sizeLabel})` : "";
    const unit = offerStatus && offerStatus.active && line.pricing.onOffer
      ? line.pricing.discounted
      : line.pricing.original;
    lines.push(
      `- ${line.item.name}${sizePart} x ${line.quantity} = Rs. ${formatPKR(unit).replace("Rs. ", "")} each, subtotal ${formatPKR(line.payableSubtotal)}`
    );
  });
  lines.push("");

  if (offerStatus && offerStatus.active && summary.hasDiscount) {
    lines.push(`Original Subtotal: ${formatPKR(summary.originalSubtotal)}`);
    lines.push(`Discount: ${offerStatus.discountPercent}%`);
    lines.push(`Total Savings: ${formatPKR(summary.discountTotal)}`);
    lines.push(`TOTAL PAYABLE: ${formatPKR(summary.payableTotal)}`);
  } else {
    lines.push(`TOTAL: ${formatPKR(summary.payableTotal)}`);
  }

  if (customer.instructions && customer.instructions.trim()) {
    lines.push("");
    lines.push(`Special Instructions: ${customer.instructions.trim()}`);
  }

  lines.push("");
  lines.push("Please confirm this order.");
  return lines.join("\n");
}

/** Build the full wa.me link with the message URL-encoded. */
export function buildWhatsAppLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Open WhatsApp in a new tab with the order message prepared.
 * Returns { ok: true, url } when the destination tab was successfully created,
 * otherwise { ok: false, error, url }.
 *
 * Implementation note: the "noopener" window feature (like rel="noopener" on
 * anchors) makes window.open() return null EVEN WHEN the tab opened fine, so
 * it cannot be used for success detection. We therefore open without the
 * feature — so a non-null return reliably means "destination opened" on both
 * mobile and desktop — and sever the opener reference manually instead.
 */
export function openWhatsApp(message) {
  const url = buildWhatsAppLink(message);
  try {
    const win = window.open(url, "_blank");
    if (!win) {
      return { ok: false, error: "popup_blocked", url };
    }
    try {
      win.opener = null; // same security effect as noopener
    } catch {
      /* cross-origin hardening is best-effort */
    }
    return { ok: true, url };
  } catch (err) {
    return { ok: false, error: "exception", url, detail: String(err) };
  }
}

export { offerConfig };
