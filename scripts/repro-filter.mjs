/**
 * Reproduction / verification of the mobile "black menu" category-filter bug.
 * Runs the production build (vite preview) in headless Chrome at a mobile
 * viewport and measures, for each category switch:
 *  - number of visible menu cards vs total cards
 *  - minimum computed opacity across visible cards
 *  - the reveal-grid height vs viewport (the old IntersectionObserver
 *    threshold: 0.08 could never be met for a very tall "All Items" grid)
 *
 * Usage: node scripts/repro-filter.mjs
 */
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const PORT = 4197;
const BASE = `http://localhost:${PORT}`;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

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

  const probe = async (page) =>
    page.evaluate(() => {
      const grid = document.querySelector(".menu-grid:not(.menu-grid--popular)");
      const cards = grid ? [...grid.querySelectorAll(".menu-card")] : [];
      const visible = cards.filter((c) => parseFloat(getComputedStyle(c).opacity) > 0.99);
      const vh = window.innerHeight;
      return {
        total: cards.length,
        visible: visible.length,
        gridHeight: grid ? grid.scrollHeight : 0,
        gridInView: grid ? grid.classList.contains("is-inview") : null,
        ratio: grid && grid.scrollHeight ? (vh / grid.scrollHeight).toFixed(3) : null,
        vh,
      };
    });

  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1366, height: 768 },
  ]) {
    console.log(`\n=== ${viewport.name} (${viewport.width}x${viewport.height}) ===`);
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.name === "mobile",
      isMobile: viewport.name === "mobile",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
    await page.evaluate(() => document.getElementById("menu")?.scrollIntoView());
    await delay(900);

    console.log("initial (All Items):", JSON.stringify(await probe(page)));

    const cycle = ["Pizza", "Burgers", "All Items", "Pizza", "All Items"];
    for (const label of cycle) {
      await page.locator(".cat-filter__chip", { hasText: label }).first().click();
      await delay(700);
      console.log(`after "${label}":`, JSON.stringify(await probe(page)));
    }

    // rapid switching — watch for long tasks / frozen UI
    const longTasks = await page.evaluate(async () => {
      const entries = [];
      const obs = new PerformanceObserver((list) => {
        list.getEntries().forEach((e) => entries.push(Math.round(e.duration)));
      });
      obs.observe({ entryTypes: ["longtask"] });
      const chips = [...document.querySelectorAll(".cat-filter__chip")];
      for (let i = 0; i < 10; i += 1) {
        chips[i % chips.length].click();
        await new Promise((r) => setTimeout(r, 150));
      }
      await new Promise((r) => setTimeout(r, 500));
      obs.disconnect();
      return entries;
    });
    console.log("long tasks during 10 rapid switches (ms):", JSON.stringify(longTasks));
    console.log("final:", JSON.stringify(await probe(page)));
    if (errors.length) console.log("page errors:", errors);

    await context.close();
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}
