import test from "node:test";
import assert from "node:assert/strict";
import {
  formatPKR, roundRupees, getPricing, computeCartSummary, getOriginalUnitPrice,
} from "../src/utils/pricing.js";
import { getOfferStatus } from "../src/utils/offerStatus.js";
import { offerConfig } from "../src/data/offer.js";
import { menuItems, getMenuItem } from "../src/data/menu.js";

const activeOffer = getOfferStatus(offerConfig, new Date("2026-10-15T12:00:00+05:00"));
const expiredOffer = getOfferStatus(offerConfig, new Date("2026-11-05T12:00:00+05:00"));

test("formatPKR groups thousands and uses Rs.", () => {
  assert.equal(formatPKR(400), "Rs. 400");
  assert.equal(formatPKR(1200), "Rs. 1,200");
  assert.equal(formatPKR(1234567), "Rs. 1,234,567");
});

test("roundRupees rounds to nearest whole rupee", () => {
  assert.equal(roundRupees(399.5), 400);
  assert.equal(roundRupees(399.4), 399);
});

test("spec example: 500 → 20% off → 400 payable, 100 saved", () => {
  const item = { price: 500, name: "Test" };
  const pricing = getPricing(item, null, activeOffer, offerConfig);
  assert.equal(pricing.original, 500);
  assert.equal(pricing.discounted, 400);
  assert.equal(pricing.savings, 100);
});

test("discount applies to the SELECTED pizza size price", () => {
  const pizza = getMenuItem("turkish-pizza"); // small 500, medium 1100, large 1500
  const small = getPricing(pizza, "small", activeOffer, offerConfig);
  const large = getPricing(pizza, "large", activeOffer, offerConfig);
  assert.equal(small.discounted, 400); // 500 × 0.8
  assert.equal(large.discounted, 1200); // 1500 × 0.8
});

test("original menu prices are NEVER mutated by a discount", () => {
  const pizza = getMenuItem("turkish-pizza");
  const before = pizza.sizes.map((s) => s.price);
  getPricing(pizza, "medium", activeOffer, offerConfig);
  const after = pizza.sizes.map((s) => s.price);
  assert.deepEqual(before, after);
  assert.equal(getOriginalUnitPrice(pizza, "medium"), 1100);
});

test("after expiry, no discount is applied anywhere", () => {
  const item = getMenuItem("zinger-burger");
  const pricing = getPricing(item, null, expiredOffer, offerConfig);
  assert.equal(pricing.onOffer, false);
  assert.equal(pricing.discounted, 350);
});

test("cart summary: mixed cart maths with active offer", () => {
  const lines = [
    { item: getMenuItem("turkish-pizza"), size: "small", quantity: 2 }, // 500 → 400 each
    { item: getMenuItem("zinger-burger"), size: null, quantity: 1 }, // 350 → 280
  ];
  const summary = computeCartSummary(lines, activeOffer, offerConfig);
  assert.equal(summary.originalSubtotal, 1350); // 1000 + 350
  assert.equal(summary.payableTotal, 1080); // 800 + 280
  assert.equal(summary.discountTotal, 270);
  assert.equal(summary.itemCount, 3);
  assert.equal(summary.hasDiscount, true);
});

test("cart summary after expiry uses regular prices only", () => {
  const lines = [
    { item: getMenuItem("turkish-pizza"), size: "small", quantity: 2 },
    { item: getMenuItem("zinger-burger"), size: null, quantity: 1 },
  ];
  const summary = computeCartSummary(lines, expiredOffer, offerConfig);
  assert.equal(summary.originalSubtotal, 1350);
  assert.equal(summary.payableTotal, 1350);
  assert.equal(summary.discountTotal, 0);
  assert.equal(summary.hasDiscount, false);
});

test("items with discountEligible:false stay at full price during the offer", () => {
  const item = { ...getMenuItem("zinger-burger"), discountEligible: false };
  const pricing = getPricing(item, null, activeOffer, offerConfig);
  assert.equal(pricing.discounted, 350);
  assert.equal(pricing.onOffer, false);
});

test("every menu item has a unique id and at least one valid price", () => {
  const ids = new Set();
  for (const item of menuItems) {
    assert.ok(!ids.has(item.id), `duplicate id: ${item.id}`);
    ids.add(item.id);
    if (item.sizes) {
      const priced = item.sizes.filter((s) => typeof s.price === "number");
      assert.ok(priced.length > 0, `${item.id} has no priced size`);
    } else {
      assert.ok(typeof item.price === "number", `${item.id} missing price`);
    }
  }
});
