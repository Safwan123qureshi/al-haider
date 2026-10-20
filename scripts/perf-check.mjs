/**
 * Rendering-cost measurements against the live or preview site.
 *
 * Usage: node scripts/perf-check.mjs [url]
 *   (default http://localhost:4173/ — start `npm run preview` first)
 *
 * Headless Chrome, 1366x768, external hosts (fonts/map) blocked so runs are
 * comparable. Reports, honestly measured (never invented):
 *  - continuously running animations while the hero is visible vs after a
 *    full-page scroll (hero "parking" check)
 *  - CDP Performance metrics accumulated DURING the full-page scroll:
 *    ScriptDuration, LayoutCount, RecalcStyleCount, TaskDuration, JS heap.
 * Run it against two URLs (e.g. old live build vs new) to compare.
 */
import { chromium } from "playwright-core";
import { setTimeout as delay } from "node:timers/promises";

const URL_ARG = process.argv[2] || "http://localhost:4173/";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const page = await ctx.newPage();

const origin = new URL(URL_ARG).origin;
await page.route("**/*", (route) => {
  const url = route.request().url();
  if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith(origin)) {
    route.continue().catch(() => {});
  } else {
    route.abort().catch(() => {});
  }
});

const session = await ctx.newCDPSession(page);

await page.goto(URL_ARG, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector(".menu-card", { timeout: 20000 });
await delay(1800); // let entrance animations finish; page reaches idle state

const runningWithHero = await page.evaluate(
  () => document.getAnimations().filter((a) => a.playState === "running").length
);

await session.send("Performance.enable");
await delay(300);
const getMetrics = async () => {
  const { metrics } = await session.send("Performance.getMetrics");
  return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
};
const before = await getMetrics();

// The expensive user journey: one continuous scroll through the whole page.
await page.evaluate(async () => {
  const height = document.documentElement.scrollHeight;
  for (let y = 0; y <= height; y += 600) {
    window.scrollTo({ top: y, behavior: "instant" });
    await new Promise((r) => requestAnimationFrame(r));
  }
});
await delay(1500);

const after = await getMetrics();
const runningAfterScroll = await page.evaluate(
  () => document.getAnimations().filter((a) => a.playState === "running").length
);

const d = (key, factor = 1) => ((after[key] - before[key]) * factor).toFixed(2);
console.log(`URL: ${URL_ARG}`);
console.log(`Running animations, hero visible : ${runningWithHero}`);
console.log(`Running animations, after scroll : ${runningAfterScroll}`);
console.log("--- accumulated during the full-page scroll ---");
console.log(`ScriptDuration   : ${d("ScriptDuration")} ms`);
console.log(`TaskDuration     : ${d("TaskDuration")} ms`);
console.log(`LayoutCount      : ${d("LayoutCount")}`);
console.log(`RecalcStyleCount : ${d("RecalcStyleCount")}`);
console.log(`LayoutDuration   : ${d("LayoutDuration")} ms`);
console.log(`RecalcStyleDuration: ${d("RecalcStyleDuration")} ms`);
console.log(`JSHeapUsedSize   : ${d("JSHeapUsedSize", 1 / 1024 / 1024)} MB (delta)`);

await browser.close();
