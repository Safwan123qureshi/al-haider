/**
 * One-off live-site verification: confirms on https://al-haider-pizza-house.vercel.app
 * that the expired offer is gone (no banner/badges/crossed prices) and that
 * menu cards + cart show regular prices with no discount.
 *
 * Usage: node scripts/live-check.mjs [url]
 */
import { chromium } from "playwright-core";
import { setTimeout as delay } from "node:timers/promises";

const URL_ARG = process.argv[2] || "https://al-haider-pizza-house.vercel.app";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const fails = [];
const ok = (m) => console.log("  OK " + m);
const bad = (m) => { fails.push(m); console.log("  X " + m); };

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(URL_ARG, { waitUntil: "networkidle", timeout: 60000 });

  // 1) No offer UI anywhere
  const ui = await page.evaluate(() => ({
    banner: !!document.querySelector(".offer-banner"),
    chip: !!document.querySelector(".hero__offer-chip"),
    offBadges: [...document.querySelectorAll(".menu-card__badge")]
      .filter((b) => b.textContent.includes("OFF")).length,
    struckPrices: document.querySelectorAll(".menu-card s").length,
  }));
  !ui.banner ? ok("no offer banner on live site") : bad("offer banner still present");
  !ui.chip ? ok("no hero offer chip") : bad("hero offer chip still present");
  ui.offBadges === 0 ? ok("no % OFF badges on cards") : bad(`${ui.offBadges} OFF badges found`);
  ui.struckPrices === 0 ? ok("no crossed-out prices on cards") : bad("crossed-out price found");

  // 2) Regular price visible on a known burger (Zinger = Rs. 350)
  await page.evaluate(() => document.getElementById("menu")?.scrollIntoView());
  await delay(400);
  const zingerText = await page.evaluate(() => {
    const card = [...document.querySelectorAll(".menu-card")]
      .find((c) => c.textContent.includes("Zinger Burger") && !c.textContent.includes("Special"));
    return card ? card.textContent : "";
  });
  zingerText.includes("Rs. 350") && !zingerText.includes("Rs. 280")
    ? ok("Zinger Burger shows regular Rs. 350 (not Rs. 280)")
    : bad("Zinger price wrong: " + zingerText.slice(-80));

  // 3) Cart: pizza + burger, no discount, total = Rs. 1,000
  await page.locator('button[aria-label="Add AH Special Pizza to cart"]').first().click();
  await delay(200);
  await page.locator('button[aria-label="Add Zinger Burger to cart"]').first().click();
  await delay(200);
  await page.locator("button.navbar__cart").click();
  await delay(500);
  const drawer = await page.evaluate(() => document.querySelector(".cart-drawer")?.textContent || "");
  !drawer.includes("Discount") ? ok("cart has no discount row") : bad("cart shows a discount row");
  drawer.includes("Rs. 1,000") ? ok("cart total Rs. 1,000 (regular prices)") : bad("cart total wrong");
  (drawer.match(/\d+%/g) || []).length === 0 ? ok("no percentage labels in cart") : bad("percentage label in cart");

  pageErrors.length === 0 ? ok("no page errors") : bad("page errors: " + pageErrors.slice(0, 2).join(" | "));
} finally {
  await browser.close();
}

console.log(fails.length ? `\nFAILED: ${fails.length}` : "\nALL LIVE CHECKS PASSED");
if (fails.length) process.exit(1);