/**
 * Real-browser verification of the checkout + WhatsApp order flow.
 * Runs the production build (vite preview) in headless Chrome and:
 *  1. adds a PIZZA and a BURGER to the cart
 *  2. verifies drawer prices / no-discount totals (20% offer has ended)
 *  3. completes the checkout form
 *  4. BLOCKED WhatsApp (window.open -> null): cart must NOT be cleared,
 *     fallback panel must appear, and clicking the manual fallback link
 *     (which is the action that opens WhatsApp) clears the cart
 *  5. SUCCESSFUL WhatsApp (window.open -> window): cart (badge + storage)
 *     must clear immediately, the generated order message must be preserved
 *     on screen, and the cleared cart must stay cleared after a reload
 *
 * Usage: node scripts/checkout-test.mjs
 */
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const PORT = 4198;
const BASE = `http://localhost:${PORT}`;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const failures = [];
const notes = [];
const fail = (m) => { failures.push(m); console.log("  X " + m); };
const pass = (m) => { notes.push(m); console.log("  OK " + m); };

async function waitForServer(url, ms = 30000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch { /* not up yet */ }
    await delay(300);
  }
  throw new Error("preview server did not start");
}

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
  cwd: process.cwd(),
  shell: true,
  stdio: "ignore",
});

let browser;
try {
  await waitForServer(BASE + "/");
  browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  // Never actually load the external WhatsApp site during tests.
  await context.route("**://wa.me/**", (route) => route.abort().catch(() => {}));
  await context.route("**://api.whatsapp.com/**", (route) => route.abort().catch(() => {}));
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(() => document.getElementById("menu")?.scrollIntoView());
  await delay(400);

  // 1) Add one pizza (AH Special Pizza — Small 650) and one burger (Zinger 350)
  await page.locator('button[aria-label="Add AH Special Pizza to cart"]').first().click();
  await delay(250);
  await page.locator('button[aria-label="Add Zinger Burger to cart"]').first().click();
  await delay(250);
  const badge = await page.evaluate(() => document.querySelector(".navbar__badge")?.textContent);
  badge === "2" ? pass("pizza + burger added (badge = 2)") : fail(`expected badge 2, got ${badge}`);

  // 2) Open drawer and verify regular prices only — the 20% offer has ended
  await page.locator("button.navbar__cart").click();
  await delay(500);
  const drawerText = await page.evaluate(() => document.querySelector(".cart-drawer")?.textContent || "");
  // 650 + 350 = 1000 regular prices, no discount anywhere
  drawerText.includes("Rs. 1,000")
    ? pass("regular-price total Rs. 1,000 shown")
    : fail("total Rs. 1,000 missing: " + drawerText.slice(0, 300));
  drawerText.includes("Discount")
    ? fail("drawer shows a discount row but the offer has ended")
    : pass("no discount row in drawer");

  // 3) Go to checkout and fill the form
  await page.locator(".cart-drawer__actions button", { hasText: "Checkout" }).click();
  await delay(400);
  await page.fill("#co-name", "Test Customer");
  await page.fill("#co-phone", "0339-5509755");
  await page.fill("#co-address", "Charsadda Chowk, Mardan");
  await delay(200);

  // 4a) BLOCKED WhatsApp: window.open stubbed to return null.
  await page.evaluate(() => {
    window.__capturedOpen = [];
    window.open = (url) => { window.__capturedOpen.push(String(url)); return null; };
  });
  await page.locator('button[type="submit"]', { hasText: "Confirm Order on WhatsApp" }).click();
  await delay(600);
  const captured = await page.evaluate(() => window.__capturedOpen || []);
  if (captured.length !== 1) fail(`window.open called ${captured.length} times (expected 1)`);
  else {
    const url = captured[0];
    url.startsWith("https://wa.me/923395509755?text=")
      ? pass("WhatsApp link targets correct number")
      : fail("unexpected WhatsApp URL: " + url.slice(0, 120));
    const msg = decodeURIComponent(url.split("?text=")[1] || "");
    for (const expected of [
      "AL HAIDER PIZZA HOUSE — NEW ORDER",
      "Customer Name: Test Customer",
      "Customer Phone: 0339-5509755",
      "Order Type: Delivery",
      "Delivery Address: Charsadda Chowk, Mardan",
      "AH Special Pizza (Small)",
      "Zinger Burger",
      "TOTAL: Rs. 1,000",
    ]) {
      msg.includes(expected)
        ? pass(`message contains "${expected}"`)
        : fail(`message missing "${expected}"`);
    }
    // The 20% offer has ended: no discount lines or percentages in the message.
    !msg.includes("Discount") && !msg.includes("20%")
      ? pass("message has no discount lines or percentages")
      : fail("message still mentions a discount");
  }

  // 4b) Popup blocked -> fallback panel, and the cart must NOT be cleared.
  const fallbackShown = await page.evaluate(() =>
    document.querySelector(".checkout-result")?.textContent.includes("We could not open WhatsApp") || false
  );
  fallbackShown ? pass("popup-blocked fallback panel shown") : fail("fallback panel missing");
  const badgeBlocked = await page.evaluate(() => document.querySelector(".navbar__badge")?.textContent || null);
  badgeBlocked === "2"
    ? pass("cart NOT cleared while WhatsApp failed to open (badge = 2)")
    : fail(`cart was cleared although WhatsApp never opened (badge = ${badgeBlocked})`);

  // 4c) Manual fallback link = the user action that opens WhatsApp -> clears.
  const newTabs = [];
  context.on("page", (p) => { if (p !== page) newTabs.push(p); });
  await page.locator('.checkout-result a[href*="wa.me"]').click();
  await delay(600);
  newTabs.length > 0
    ? pass("manual fallback link opened a WhatsApp tab")
    : fail("manual fallback link did not open a tab");
  const badgeAfterManual = await page.evaluate(() => document.querySelector(".navbar__badge")?.textContent || null);
  badgeAfterManual === null
    ? pass("cart cleared after manual WhatsApp link click")
    : fail("cart not cleared after manual link click (badge = " + badgeAfterManual + ")");
  for (const t of newTabs) await t.close().catch(() => {});

  // 5) SUCCESSFUL WhatsApp: window.open stubbed to return a window-like object.
  await page.reload({ waitUntil: "networkidle" });
  await delay(500);
  const badgeAfterReload = await page.evaluate(() => document.querySelector(".navbar__badge")?.textContent || null);
  badgeAfterReload === null
    ? pass("cleared cart stays cleared after reload (badge absent)")
    : fail("old cart items returned after reload (badge = " + badgeAfterReload + ")");
  await page.evaluate(() => document.getElementById("menu")?.scrollIntoView());
  await delay(300);
  await page.locator('button[aria-label="Add AH Special Pizza to cart"]').first().click();
  await delay(200);
  await page.locator('button[aria-label="Add Zinger Burger to cart"]').first().click();
  await delay(200);
  await page.locator("button.navbar__cart").click();
  await delay(400);
  await page.locator(".cart-drawer__actions button", { hasText: "Checkout" }).click();
  await delay(300);
  await page.fill("#co-name", "Test Customer");
  await page.fill("#co-phone", "0339-5509755");
  await page.fill("#co-address", "Charsadda Chowk, Mardan");

  await page.evaluate(() => {
    window.__capturedOpen = [];
    window.open = (url) => { window.__capturedOpen.push(String(url)); return {}; };
  });
  await page.locator('button[type="submit"]', { hasText: "Confirm Order on WhatsApp" }).click();
  await delay(600);

  const successPanel = await page.evaluate(() => document.querySelector(".checkout-result")?.textContent || "");
  successPanel.includes("WhatsApp is opening")
    ? pass("success panel shown when WhatsApp opens")
    : fail("success panel missing: " + successPanel.slice(0, 160));
  successPanel.includes("not confirmed until you send it")
    ? pass("panel does not claim the order was sent/received")
    : fail("panel wording must state the order is not confirmed until sent");
  successPanel.includes("cart has been cleared")
    ? pass("panel informs the cart was cleared")
    : fail("panel missing cart-cleared note");

  const badgeSuccess = await page.evaluate(() => document.querySelector(".navbar__badge")?.textContent || null);
  badgeSuccess === null
    ? pass("cart badge reset to zero after WhatsApp opened")
    : fail("badge still shows " + badgeSuccess + " after successful open");

  const stored = await page.evaluate(() => window.localStorage.getItem("alhaider_cart_v1"));
  stored === "[]"
    ? pass("localStorage cart cleared ([] persisted)")
    : fail("localStorage cart not cleared: " + stored);

  const preservedMsg = await page.evaluate(() => document.querySelector(".checkout-result textarea")?.value || "");
  preservedMsg.includes("Zinger Burger") && preservedMsg.includes("TOTAL: Rs. 1,000")
    ? pass("generated order message preserved on screen after clearing")
    : fail("order message not preserved: " + preservedMsg.slice(0, 120));

  await page.reload({ waitUntil: "networkidle" });
  await delay(500);
  const badgeFinal = await page.evaluate(() => document.querySelector(".navbar__badge")?.textContent || null);
  badgeFinal === null
    ? pass("cleared cart still cleared after reload (success path)")
    : fail("cart returned after reload (badge = " + badgeFinal + ")");

  pageErrors.length === 0
    ? pass("no uncaught page errors")
    : fail("page errors: " + pageErrors.slice(0, 3).join(" | "));

  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill();
}

console.log("\n================ RESULT ================");
console.log(`passed: ${notes.length}, failed: ${failures.length}`);
if (failures.length) {
  failures.forEach((f) => console.log("  X " + f));
  process.exit(1);
}
console.log("ALL CHECKS PASSED");