/**
 * Live production verification for https://al-haider-pizza-house.vercel.app
 * (accepts a URL argument). Verifies in headless Chrome at mobile AND desktop
 * viewports, using the site exactly as a customer would:
 *  1. no console/page errors, no horizontal overflow
 *  2. All Items shows every menu product immediately (no black screen)
 *  3. category switching keeps products visible in every order
 *  4. add to cart -> totals correct -> WhatsApp checkout opens ->
 *     cart clears (badge + storage) and stays cleared after reload
 *
 * Usage: node scripts/live-verify.mjs [url]
 */
import { chromium } from "playwright-core";
import { setTimeout as delay } from "node:timers/promises";

const URL_ARG = process.argv[2] || "https://al-haider-pizza-house.vercel.app";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const failures = [];
const notes = [];
const fail = (m) => { failures.push(m); console.log("  X " + m); };
const pass = (m) => { notes.push(m); console.log("  OK " + m); };

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
try {
  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1366, height: 768 },
  ]) {
    console.log(`\n=== ${viewport.name} (${viewport.width}x${viewport.height}) — ${URL_ARG} ===`);
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    // Never actually load the external WhatsApp site during tests.
    await context.route("**://wa.me/**", (route) => route.abort().catch(() => {}));
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

    await page.goto(URL_ARG, { waitUntil: "networkidle", timeout: 60000 });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    overflow <= 1 ? pass("no horizontal overflow") : fail(`horizontal overflow of ${overflow}px`);

    await page.evaluate(() => document.getElementById("menu")?.scrollIntoView());
    await delay(1200);

    const probe = () =>
      page.evaluate(() => {
        const grid = document.querySelector(".menu-grid:not(.menu-grid--popular)");
        const cards = grid ? [...grid.querySelectorAll(".menu-card")] : [];
        const visible = cards.filter((c) => {
          const r = c.getBoundingClientRect();
          const o = parseFloat(getComputedStyle(c).opacity);
          // off-screen cards trivially pass; on-screen ones must be opaque
          // (cards mid-stagger may be partially faded during entrance)
          return r.bottom < 0 || r.top > window.innerHeight || o > 0.9;
        });
        return { total: cards.length, visible: visible.length };
      });

    const initial = await probe();
    initial.total > 0 && initial.visible === initial.total
      ? pass(`All Items: all ${initial.total} products visible immediately`)
      : fail(`All Items: ${initial.visible}/${initial.total} visible`);

    for (const label of ["Pizza", "Burgers", "All Items"]) {
      await page.locator(".cat-filter__chip", { hasText: label }).first().click();
      await delay(1400);
      const p = await probe();
      p.visible === p.total && p.total > 0
        ? pass(`"${label}": all ${p.total} products visible`)
        : fail(`"${label}": ${p.visible}/${p.total} visible`);
    }
    // Cart + checkout flow on the live site
    await page.locator('button[aria-label="Add AH Special Pizza to cart"]').first().click();
    await delay(250);
    await page.locator('button[aria-label="Add Zinger Burger to cart"]').first().click();
    await delay(250);
    let badge = await page.evaluate(() => document.querySelector(".navbar__badge")?.textContent);
    badge === "2" ? pass("cart badge = 2 after adds") : fail(`badge = ${badge}, expected 2`);

    await page.locator("button.navbar__cart").click();
    await delay(500);
    const drawerText = await page.evaluate(() => document.querySelector(".cart-drawer")?.textContent || "");
    drawerText.includes("Rs. 1,000")
      ? pass("live totals show Rs. 1,000")
      : fail("total missing: " + drawerText.slice(0, 200));

    await page.locator(".cart-drawer__actions button", { hasText: "Checkout" }).click();
    await delay(400);
    await page.fill("#co-name", "Live Test");
    await page.fill("#co-phone", "0339-5509755");
    await page.fill("#co-address", "Charsadda Chowk, Mardan");
    await page.evaluate(() => {
      window.__open = [];
      window.open = (url) => { window.__open.push(String(url)); return {}; };
    });
    await page.locator('button[type="submit"]', { hasText: "Confirm Order on WhatsApp" }).click();
    await delay(800);

    const openUrl = await page.evaluate(() => window.__open[0] || "");
    openUrl.startsWith("https://wa.me/923395509755?text=")
      ? pass("live checkout opened correct WhatsApp link")
      : fail("bad WhatsApp URL: " + openUrl.slice(0, 100));
    const msg = decodeURIComponent(openUrl.split("?text=")[1] || "");
    msg.includes("AH Special Pizza") && msg.includes("Zinger Burger") && msg.includes("TOTAL: Rs. 1,000")
      ? pass("live order message has items + correct total")
      : fail("message wrong: " + msg.slice(0, 150));

    badge = await page.evaluate(() => document.querySelector(".navbar__badge")?.textContent || null);
    const stored = await page.evaluate(() => window.localStorage.getItem("alhaider_cart_v1"));
    badge === null && stored === "[]"
      ? pass("live cart cleared after WhatsApp opened (badge gone, storage [])")
      : fail(`cart not cleared: badge=${badge}, storage=${stored}`);

    const panel = await page.evaluate(() => document.querySelector(".checkout-result")?.textContent || "");
    panel.includes("not confirmed until you send it")
      ? pass("panel does not claim the order was sent")
      : fail("panel wording wrong");

    await page.reload({ waitUntil: "networkidle" });
    await delay(600);
    badge = await page.evaluate(() => document.querySelector(".navbar__badge")?.textContent || null);
    badge === null
      ? pass("cleared cart stays cleared after reload on live site")
      : fail("cart returned after reload (badge = " + badge + ")");

    const realErrors = errors.filter((e) => !/fonts\.|maps\.|net::ERR|Failed to load resource|chrome-extension/i.test(e));
    realErrors.length === 0
      ? pass("no console/page errors")
      : fail("errors: " + realErrors.slice(0, 3).join(" | "));

    await context.close();
  }
} finally {
  await browser.close();
}

console.log("\n================ RESULT ================");
console.log(`passed: ${notes.length}, failed: ${failures.length}`);
if (failures.length) {
  failures.forEach((f) => console.log("  X " + f));
  process.exit(1);
}
console.log("ALL LIVE CHECKS PASSED");
