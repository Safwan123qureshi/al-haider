import { offerConfig } from "../data/offer.js";

/**
 * Parse a date string that MUST contain an explicit timezone offset
 * (e.g. "2026-10-31T23:59:00+05:00"). Returns a valid Date or null.
 */
function parseOffsetDate(value) {
  if (!value || typeof value !== "string") return null;
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/.test(value.trim());
  if (!hasOffset) return null; // refuse naive dates to avoid silent timezone bugs
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Decide whether the promotional offer is currently active.
 *
 * Rules:
 *  - enabled must be true
 *  - if startDate is configured, current time must be >= startDate
 *  - current time must be STRICTLY EARLIER than endDate
 *    (at exactly endDate the offer is inactive)
 *
 * @param {object}  config   offer configuration (defaults to src/data/offer.js)
 * @param {Date|string|number} now  current time (injectable for testing)
 * @returns {{active: boolean, discountPercent: number, endDate: Date|null,
 *            startDate: Date|null, reason: string, secondsRemaining: number}}
 */
export function getOfferStatus(config = offerConfig, now = new Date()) {
  const current = now instanceof Date ? now : new Date(now);
  const cfg = config || {};

  const result = {
    active: false,
    discountPercent: Number(cfg.discountPercent) || 0,
    endDate: null,
    startDate: null,
    reason: "",
    secondsRemaining: 0,
  };

  if (!cfg.enabled) {
    result.reason = "Offer disabled in configuration.";
    return result;
  }

  const endDate = parseOffsetDate(cfg.endDate);
  result.endDate = endDate;
  if (!endDate) {
    result.reason = "Invalid offer end date (must include timezone offset).";
    return result;
  }

  let startDate = null;
  if (cfg.startDate) {
    startDate = parseOffsetDate(cfg.startDate);
    result.startDate = startDate;
    if (!startDate) {
      result.reason = "Invalid offer start date (must include timezone offset).";
      return result;
    }
    if (current.getTime() < startDate.getTime()) {
      result.reason = "Offer has not started yet.";
      result.secondsRemaining = Math.floor((startDate.getTime() - current.getTime()) / 1000);
      return result;
    }
  }

  if (current.getTime() >= endDate.getTime()) {
    result.reason = "Offer expired.";
    return result;
  }

  result.active = true;
  result.reason = "Offer is active.";
  result.secondsRemaining = Math.floor((endDate.getTime() - current.getTime()) / 1000);
  return result;
}

/**
 * Should a specific menu item receive the discount?
 * Respects offerConfig.applyToAllItems and the item's discountEligible flag.
 */
export function isItemDiscountEligible(item, offerStatus, config = offerConfig) {
  if (!offerStatus || !offerStatus.active) return false;
  if (!item) return false;
  if (item.discountEligible === false) return false;
  if (config && config.applyToAllItems === false) {
    return item.discountEligible === true;
  }
  return true;
}
