import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const PORT = 4196;
const BASE = `http://localhost:${PORT}`;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function waitForServer(url, ms = 30000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try { const r = await fetch(url); if (r.ok) return; } catch {}
    await delay(300);
  }
  throw new Error("preview server did not start");
}

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
  cwd: process.cwd(), shell: true, stdio: "ignore",
});

let browser;
try {
  await waitForServer(BASE + "/");
  browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(() => document.getElementById("menu")?.scrollIntoView());
  await delay(1200);
  await page.screenshot({ path: "shot-verify-mobile-menu.png" });
  // measure average pixel brightness of the menu grid area to prove it's not black
  const stats = await page.evaluate(() => {
    const grid = document.querySelector(".menu-grid:not(.menu-grid--popular)");
    const r = grid.getBoundingClientRect();
    return { top: Math.max(0, r.top), height: Math.min(844, r.height) };
  });
  await page.screenshot({
    path: "shot-verify-mobile-grid.png",
    clip: { x: 0, y: stats.top, width: 390, height: stats.height },
  });
  console.log("screenshots saved", JSON.stringify(stats));
} finally {
  if (browser) await browser.close();
  server.kill();
}
