import test from "node:test";
import assert from "node:assert/strict";
import { getOfferStatus, isItemDiscountEligible } from "../src/utils/offerStatus.js";

const EXPIRY = "2026-10-31T23:59:00+05:00";

const baseConfig = {
  enabled: true,
  discountPercent: 20,
  startDate: null,
  endDate: EXPIRY,
  applyToAllItems: true,
};

// One second before expiry → ACTIVE
test("offer is active 1 second before expiry", () => {
  const now = new Date("2026-10-31T23:58:59+05:00");
  const status = getOfferStatus(baseConfig, now);
  assert.equal(status.active, true);
  assert.equal(status.discountPercent, 20);
});

// Exactly at expiry → INACTIVE
test("offer is inactive AT the exact expiry timestamp", () => {
  const now = new Date(EXPIRY);
  const status = getOfferStatus(baseConfig, now);
  assert.equal(status.active, false);
  assert.equal(status.reason, "Offer expired.");
});

// After expiry → INACTIVE
test("offer is inactive after expiry", () => {
  const now = new Date("2026-11-01T00:00:01+05:00");
  const status = getOfferStatus(baseConfig, now);
  assert.equal(status.active, false);
});

// Expired state persists regardless of device timezone:
// 23:59 PKT on Oct 31 equals 18:59 UTC — a naive "still Oct 31 in UTC" check would wrongly keep it active.
test("expiry is evaluated with the +05:00 offset, not the device timezone", () => {
  const nowUtcEquivalent = new Date("2026-10-31T18:59:00Z"); // == 2026-10-31T23:59:00+05:00
  const status = getOfferStatus(baseConfig, nowUtcEquivalent);
  assert.equal(status.active, false);
});

// Disabled config
test("disabled offer is never active", () => {
  const now = new Date("2026-10-01T12:00:00+05:00");
  const status = getOfferStatus({ ...baseConfig, enabled: false }, now);
  assert.equal(status.active, false);
});

// Future start date
test("offer inactive before a configured start date", () => {
  const config = { ...baseConfig, startDate: "2026-10-20T00:00:00+05:00" };
  const before = getOfferStatus(config, new Date("2026-10-19T23:59:59+05:00"));
  assert.equal(before.active, false);
  const after = getOfferStatus(config, new Date("2026-10-20T00:00:00+05:00"));
  assert.equal(after.active, true);
});

// Naive (offset-less) dates are refused rather than silently misinterpreted
test("invalid/naive end date keeps the offer safely inactive", () => {
  const status = getOfferStatus({ ...baseConfig, endDate: "2026-10-31T23:59:00" }, new Date("2026-10-01T12:00:00+05:00"));
  assert.equal(status.active, false);
});

// Eligibility respects per-item opt-out
test("items with discountEligible:false never receive the discount", () => {
  const now = new Date("2026-10-01T12:00:00+05:00");
  const status = getOfferStatus(baseConfig, now);
  assert.equal(isItemDiscountEligible({ discountEligible: false }, status, baseConfig), false);
  assert.equal(isItemDiscountEligible({ name: "Regular item" }, status, baseConfig), true);
});

// applyToAllItems: false → only explicitly eligible items
test("applyToAllItems:false restricts the discount to opted-in items", () => {
  const now = new Date("2026-10-01T12:00:00+05:00");
  const config = { ...baseConfig, applyToAllItems: false };
  const status = getOfferStatus(config, now);
  assert.equal(isItemDiscountEligible({ name: "A" }, status, config), false);
  assert.equal(isItemDiscountEligible({ name: "B", discountEligible: true }, status, config), true);
});
