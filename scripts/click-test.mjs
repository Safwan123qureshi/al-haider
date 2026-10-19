/**
 * Real-browser reproduction of "Add to Cart opens a blank new tab".
 * Runs the production build (vite preview) in headless Chrome and:
 *  1. detects ANY new tab/page opened during Add-to-Cart clicks
 *  2. captures console errors / uncaught page errors
 *  3. verifies the click target element (buttons vs links)
 *  4. hunts for layout overlap (WhatsApp FAB covering card buttons)
 *  5. exercises the cart drawer (qty, totals, close)
 *
 * Usage: node scripts/click-test.mjs
 */
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const PORT = 4199;
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

  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1366, height: 768 },
  ]) {
    console.log(`\n=== ${viewport.name} (${viewport.width}x${viewport.height}) ===`);
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });

    // NOTE: the "page" event fires for EVERY page in the context — including the
    // main one created by newPage() — so it must be attached AFTER creation and
    // must exclude the main page, otherwise the script false-positives "new tab".
    const newTabs = [];
    const page = await context.newPage();
    context.on("page", (p) => { if (p !== page) newTabs.push(p); });
    const consoleErrors = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

    await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
    await page.evaluate(() => document.getElementById("menu")?.scrollIntoView());
    await delay(400);

    const tagInfo = await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")].filter((b) =>
        (b.getAttribute("aria-label") || "").startsWith("Add ")
      );
      return {
        count: btns.length,
        allButtons: btns.every((b) => b.tagName === "BUTTON"),
        anyHref: btns.some((b) => b.hasAttribute("href")),
        anyTarget: btns.some((b) => b.hasAttribute("target")),
        inForm: btns.some((b) => !!b.closest("form")),
      };
    });
    tagInfo.count > 0
      ? pass(`found ${tagInfo.count} Add-to-Cart controls`)
      : fail("no Add-to-Cart controls found");
    tagInfo.allButtons && !tagInfo.anyHref && !tagInfo.anyTarget && !tagInfo.inForm
      ? pass("all are plain <button type=button> - no href/target/form")
      : fail("controls not plain buttons: " + JSON.stringify(tagInfo));

    // What element sits ON TOP of each Add-to-Cart button? (layout interception)
    const overlaps = await page.evaluate(() => {
      const fab = document.querySelector(".fab-whatsapp");
      if (!fab) return { fabMissing: true };
      const fr = fab.getBoundingClientRect();
      const hits = [];
      for (const b of document.querySelectorAll("button")) {
        if (!(b.getAttribute("aria-label") || "").startsWith("Add ")) continue;
        const r = b.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight || r.width === 0) continue;
        const ox = Math.max(0, Math.min(r.right, fr.right) - Math.max(r.left, fr.left));
        const oy = Math.max(0, Math.min(r.bottom, fr.bottom) - Math.max(r.top, fr.top));
        if (ox > 0 && oy > 0) {
          hits.push({ label: b.getAttribute("aria-label"), fabOverlapPx: Math.round(ox) + "x" + Math.round(oy) });
        }
        for (const [x, y] of [
          [r.left + r.width / 2, r.top + r.height / 2],
          [r.right - 6, r.top + r.height / 2],
        ]) {
          // Points currently under the intentionally fixed navbar are a normal,
          // transient scroll state (content passes beneath it) — not an
          // interception. Persistent overlays (e.g. the WhatsApp FAB) are still
          // caught by the dedicated overlap check above.
          const navRect = document.querySelector(".navbar")?.getBoundingClientRect();
          if (navRect && y >= navRect.top && y <= navRect.bottom) continue;
          const top = document.elementFromPoint(x, y);
          if (top && !b.contains(top) && top !== b && top.closest("a")) {
            hits.push({ label: b.getAttribute("aria-label"), interceptedBy: String(top.closest("a").className), at: Math.round(x) + "," + Math.round(y) });
          }
        }
      }
      return { fabMissing: false, hits };
    });
    if (overlaps.fabMissing) notes.push("no FAB found");
    else if (overlaps.hits.length === 0) pass("no element intercepts Add-to-Cart clicks at current scroll");
    else fail("Add-to-Cart intercepted/overlapped: " + JSON.stringify(overlaps.hits));

    // Click Add-to-Cart buttons while watching for NEW TABS
    const labels = await page.evaluate(() =>
      [...document.querySelectorAll("button")]
        .map((b) => b.getAttribute("aria-label"))
        .filter((l) => l && l.startsWith("Add "))
    );
    let clicked = 0;
    for (const label of labels.slice(0, 5)) {
      try {
        const el = page.locator(`button[aria-label="${label}"]`).first();
        await el.scrollIntoViewIfNeeded();
        await delay(200);
        await el.click({ timeout: 4000 });
        clicked++;
        await delay(350);
        if (newTabs.length) break;
      } catch (e) {
        fail(`click on "${label}" failed/intercepted: ${e.message.split("\n")[0]}`);
      }
    }
    clicked > 0 ? pass(`${clicked} Add-to-Cart clicks performed`) : fail("no clicks performed");
    newTabs.length === 0
      ? pass("no new tab opened during Add-to-Cart clicks")
      : fail(
          `NEW TAB OPENED (${newTabs.length}): ` +
            newTabs.map((p) => p.url() || "about:blank").join(", ")
        );

    const badge = await page.evaluate(
      () => document.querySelector(".navbar__badge")?.textContent || null
    );
    badge ? pass(`navbar badge shows ${badge}`) : fail("navbar badge missing after add");

    // Cart drawer flow
    await page.locator("button.navbar__cart").click();
    await delay(500);
    const drawerOpen = await page.evaluate(() =>
      document.querySelector(".cart-drawer")?.classList.contains("is-open")
    );
    drawerOpen ? pass("cart drawer opens") : fail("cart drawer did NOT open");

    const drawerText = await page.evaluate(
      () => document.querySelector(".cart-drawer")?.textContent || ""
    );
    drawerText.includes("Total Payable") ? pass("drawer shows totals") : fail("drawer missing totals");
    drawerText.includes("Rs.") ? pass("drawer shows prices") : fail("drawer missing prices");
    drawerText.includes("Discount")
      ? pass("drawer shows 20% offer discount row")
      : fail("drawer missing discount row");

    const plus = page.locator('.cart-drawer button[aria-label="Increase quantity"]').first();
    if (await plus.count()) {
      await plus.click();
      await delay(300);
      const badge2 = await page.evaluate(
        () => document.querySelector(".navbar__badge")?.textContent || null
      );
      badge2 && Number(badge2) > Number(badge)
        ? pass(`quantity + updates badge to ${badge2}`)
        : fail("quantity + did not update badge");
      const minus = page.locator('.cart-drawer button[aria-label="Decrease quantity"]').first();
      await minus.click();
      await delay(300);
      pass("quantity - clicked without error");
    } else fail("increase-quantity button missing");

    await page.keyboard.press("Escape");
    await delay(300);
    const closed = await page.evaluate(
      () => !document.querySelector(".cart-drawer")?.classList.contains("is-open")
    );
    closed ? pass("Escape closes drawer") : fail("Escape did not close drawer");

    // Reload -> cart persisted
    await page.reload({ waitUntil: "domcontentloaded" });
    await delay(600);
    const badgeAfter = await page.evaluate(
      () => document.querySelector(".navbar__badge")?.textContent || null
    );
    badgeAfter ? pass(`cart persisted after reload (badge ${badgeAfter})`) : fail("cart lost after reload");

    // Console/page errors (ignore third-party font noise)
    const realErrors = consoleErrors.filter(
      (e) => !/favicon|fonts\.googleapis|net::ERR|Failed to load resource/i.test(e)
    );
    realErrors.length === 0
      ? pass("no console/page errors")
      : fail("console errors: " + realErrors.slice(0, 3).join(" | "));

    await context.close();
  }
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
