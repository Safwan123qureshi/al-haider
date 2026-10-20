/**
 * Premium upgrade verification against the LOCAL preview build.
 *
 * Usage: node scripts/premium-check.mjs [url]
 *   (start `npm run preview` first — default http://localhost:4173/)
 *
 * Verifies: no JS errors, hero 3D scene, menu-card tilt, staggered reveal,
 * cart → checkout → WhatsApp link, regular prices only, responsive layouts
 * (desktop / tablet / mobile) and reduced-motion behaviour.
 */
import { chromium } from "playwright-core";
import { setTimeout as delay } from "node:timers/promises";

const URL_ARG = process.argv[2] || "http://localhost:4173/";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const fails = [];
const ok = (m) => console.log("  OK  " + m);
const bad = (m) => {
  fails.push(m);
  console.log("  X   " + m);
};

const browser = await chromium.launch({ headless: true, executablePath: CHROME });

/* External hosts (fonts/map) are irrelevant to app logic — abort them so the
   run is hermetic, and ignore their console noise below. */
const isExternalNoise = (url = "") =>
  /fonts\.(googleapis|gstatic)\.com|google\.com\/maps|maps\.googleapis|gstatic|recaptcha/.test(url);

const pageErrors = [];
const consoleErrors = [];
const origin = new URL(URL_ARG).origin;

async function newPage(context) {
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const loc = msg.location() || {};
    if (isExternalNoise(loc.url || "")) return;
    consoleErrors.push(`${msg.text()} @ ${loc.url || "?"}`);
  });
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("data:") || url.startsWith("blob:")) {
      route.continue().catch(() => {});
    } else if (isExternalNoise(url)) {
      route.abort().catch(() => {});
    } else {
      try {
        if (new URL(url).origin === origin) route.continue().catch(() => {});
        else route.abort().catch(() => {});
      } catch {
        route.abort().catch(() => {});
      }
    }
  });
  return page;
}

try {
  /* ---------------- Desktop 1366×768 ---------------- */
  console.log("\n== Desktop 1366x768 ==");
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await newPage(ctx);

  await page.goto(URL_ARG, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(".menu-card", { timeout: 20000 });
  await delay(600);

  // 1) Hero 3D scene
  const hero = await page.evaluate(() => {
    const scene = document.querySelector(".hero__scene");
    const disc = document.querySelector(".hero__disc-face img");
    const cta = [...document.querySelectorAll(".hero__actions .btn")].find((b) =>
      b.textContent.includes("Order Now")
    );
    return {
      scene: !!scene,
      discLoaded: Boolean(disc && disc.complete && disc.naturalWidth > 0),
      orderNow: Boolean(cta),
      revealActive: document.documentElement.classList.contains("reveal-active"),
    };
  });
  hero.scene ? ok("hero 3D scene rendered") : bad("hero scene missing");
  hero.discLoaded ? ok("floating pizza disc image loaded") : bad("disc image not loaded");
  hero.orderNow ? ok("'Order Now' CTA present") : bad("Order Now CTA missing");
  hero.revealActive ? ok("reveal system active (IO supported)") : bad("reveal system not active");

  // 2) No offer UI anywhere
  const offer = await page.evaluate(() => ({
    banner: !!document.querySelector(".offer-banner"),
    chip: !!document.querySelector(".hero__offer-chip"),
    off: [...document.querySelectorAll(".menu-card__badge")].filter((b) =>
      b.textContent.includes("OFF")
    ).length,
    struck: document.querySelectorAll(".menu-card s").length,
  }));
  !offer.banner ? ok("no offer banner") : bad("offer banner present");
  !offer.chip ? ok("no hero offer chip") : bad("hero offer chip present");
  offer.off === 0 ? ok("no % OFF badges") : bad(`${offer.off} OFF badges`);
  offer.struck === 0 ? ok("no crossed-out prices") : bad("crossed-out price found");

  // 3) Regular price on Zinger (Rs. 350)
  await page.evaluate(() => document.getElementById("menu")?.scrollIntoView());
  await delay(700);
  const zinger = await page.evaluate(() => {
    const card = [...document.querySelectorAll(".menu-card")].find(
      (c) => c.textContent.includes("Zinger Burger") && !c.textContent.includes("Special")
    );
    return card ? card.textContent : "";
  });
  zinger.includes("Rs. 350") && !zinger.includes("Rs. 280")
    ? ok("Zinger Burger Rs. 350 regular price")
    : bad("Zinger price wrong: " + zinger.slice(-90));

  // 4) Menu-card 3D tilt on pointer move
  const card = page.locator(".menu-card").first();
  await card.hover({ position: { x: 30, y: 30 } });
  await delay(120);
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.25, { steps: 6 });
  await delay(250);
  const tilt = await card.evaluate((el) => ({
    rx: el.style.getPropertyValue("--tilt-rx"),
    ry: el.style.getPropertyValue("--tilt-ry"),
    transform: getComputedStyle(el).transform,
  }));
  tilt.rx && tilt.rx !== "0deg" && tilt.ry !== "0deg"
    ? ok(`card tilt active (rx=${tilt.rx}, ry=${tilt.ry})`)
    : bad("card tilt did not activate: " + JSON.stringify(tilt));
  tilt.transform !== "none" && tilt.transform.startsWith("matrix3d")
    ? ok("card renders a 3D matrix transform")
    : bad("card transform is not 3D: " + tilt.transform.slice(0, 40));

  await page.mouse.move(5, 5, { steps: 4 });
  await delay(400);
  const tiltReset = await card.evaluate((el) => el.style.getPropertyValue("--tilt-rx"));
  tiltReset === "0deg" ? ok("tilt resets on pointer leave") : bad("tilt stuck at " + tiltReset);

  // 5) Cart flow: add → qty → checkout → WhatsApp link
  await page.locator('button[aria-label="Add AH Special Pizza to cart"]').first().click();
  await page.locator('button[aria-label="Add Zinger Burger to cart"]').first().click();
  await delay(250);
  const badge = await page.evaluate(() => document.querySelector(".navbar__badge")?.textContent);
  badge === "2" ? ok("navbar badge shows 2") : bad("badge = " + badge);

  await page.locator("button.navbar__cart").click();
  await delay(600);
  const drawerOk = await page.evaluate(() => {
    const d = document.querySelector(".cart-drawer");
    return {
      open: d.classList.contains("is-open"),
      text: d.textContent,
      total: d.textContent.includes("Rs. 1,000"),
      discount: d.textContent.includes("Discount"),
      percent: (d.textContent.match(/\d+%/g) || []).length,
    };
  });
  drawerOk.open ? ok("cart drawer opens") : bad("drawer not open");
  drawerOk.total ? ok("cart total Rs. 1,000 (regular prices)") : bad("wrong total");
  !drawerOk.discount ? ok("no discount row") : bad("discount row present");
  drawerOk.percent === 0 ? ok("no percentage labels in cart") : bad("percentage label found");

  await page.getByLabel("Increase quantity").first().click();
  await delay(200);
  const qtyUp = await page.evaluate(() => document.querySelector(".navbar__badge")?.textContent);
  qtyUp === "3" ? ok("quantity + works (badge 3)") : bad("qty+ badge = " + qtyUp);
  await page.getByLabel("Decrease quantity").first().click();
  await delay(200);

  // checkout → WhatsApp
  await page.locator(".cart-drawer__actions button", { hasText: "Checkout" }).click();
  await delay(300);
  await page.fill("#co-name", "Test Customer");
  await page.fill("#co-phone", "0339-5509755");
  await page.fill("#co-address", "Charsadda Chowk, Mardan");
  const popupPromise = page.waitForEvent("popup", { timeout: 8000 }).catch(() => null);
  await page.locator(".checkout-form button[type=submit]").click();
  const popup = await popupPromise;
  let popupUrl = "";
  if (popup) {
    popupUrl = popup.url();
    await popup.close().catch(() => {});
  }
  await delay(400);
  const resultHref = await page.evaluate(
    () => document.querySelector(".checkout-result a")?.getAttribute("href") || ""
  );
  // The app's own link is wa.me (which may redirect to api.whatsapp.com in the popup).
  const waUrl = resultHref || popupUrl;
  /https:\/\/(wa\.me\/923395509755|api\.whatsapp\.com\/send)/.test(waUrl)
    ? ok("checkout opens WhatsApp order link")
    : bad("WhatsApp link missing: " + waUrl.slice(0, 80));
  const textParam = (waUrl.match(/[?&]text=([^&]+)/) || [])[1] || "";
  const decoded = decodeURIComponent(textParam.replace(/\+/g, " "));
  decoded.includes("AL HAIDER PIZZA HOUSE — NEW ORDER") && decoded.includes("TOTAL: Rs. 1,000")
    ? ok("WhatsApp message contains order + correct total")
    : bad("WhatsApp message wrong: " + decoded.slice(0, 160).replace(/\n/g, " | "));

  // 6) Full-page scroll → everything revealed, no hidden content.
  // Close the drawer first (it locks body scroll), use instant scrolling so
  // html{scroll-behavior:smooth} cannot lag behind the probe loop, then poll
  // until every reveal target has finished its transition.
  await page.keyboard.press("Escape");
  await delay(500);
  await page.evaluate(async () => {
    const height = document.documentElement.scrollHeight;
    for (let y = 0; y <= height; y += 450) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
  });

  let reveal = { total: 0, hidden: [] };
  for (let attempt = 0; attempt < 25; attempt += 1) {
    reveal = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("[data-reveal], [data-reveal-grid]")];
      const hidden = nodes.filter((n) => parseFloat(getComputedStyle(n).opacity) < 0.99);
      return {
        total: nodes.length,
        hidden: hidden.map((n) => `${n.className}@${Math.round(n.getBoundingClientRect().top)}`),
      };
    });
    if (reveal.hidden.length === 0) break;
    await delay(300);
  }
  reveal.hidden.length === 0
    ? ok(`all ${reveal.total} reveal targets visible after scroll`)
    : bad(`hidden after scroll: ${reveal.hidden.join(", ")} (scrollY=${await page.evaluate(() => window.scrollY)})`);

  // 7) No horizontal overflow on desktop
  const overflowDesktop = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  overflowDesktop <= 1
    ? ok("no horizontal overflow (desktop)")
    : bad(`horizontal overflow ${overflowDesktop}px (desktop)`);

  await ctx.close();

  /* ---------------- Tablet 768×1024 ---------------- */
  console.log("\n== Tablet 768x1024 ==");
  const tCtx = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    hasTouch: true,
  });
  const tPage = await newPage(tCtx);
  await tPage.goto(URL_ARG, { waitUntil: "domcontentloaded", timeout: 60000 });
  await tPage.waitForSelector(".menu-card", { timeout: 20000 });
  await delay(500);
  const overflowT = await tPage.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  overflowT <= 1 ? ok("no horizontal overflow (tablet)") : bad(`overflow ${overflowT}px (tablet)`);
  await tCtx.close();

  /* ---------------- Mobile 390×844 (touch) ---------------- */
  console.log("\n== Mobile 390x844 (touch) ==");
  const mCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
  });
  const mPage = await newPage(mCtx);
  await mPage.goto(URL_ARG, { waitUntil: "domcontentloaded", timeout: 60000 });
  await mPage.waitForSelector(".menu-card", { timeout: 20000 });
  await delay(500);

  const mHero = await mPage.evaluate(() => {
    const disc = document.querySelector(".hero__disc-pos");
    const burger = document.querySelector(".navbar__burger");
    const cta = [...document.querySelectorAll(".hero__actions .btn")].find((b) =>
      b.textContent.includes("Order Now")
    );
    return {
      discHidden: !disc || getComputedStyle(disc).display === "none",
      burgerVisible: burger && getComputedStyle(burger).display !== "none",
      orderNow: Boolean(cta),
    };
  });
  mHero.discHidden ? ok("3D props hidden on mobile (perf)") : bad("3D props visible on mobile");
  mHero.burgerVisible ? ok("mobile burger menu visible") : bad("burger menu hidden");
  mHero.orderNow ? ok("Order Now CTA on mobile") : bad("Order Now missing on mobile");

  const overflowM = await mPage.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  overflowM <= 1 ? ok("no horizontal overflow (mobile)") : bad(`overflow ${overflowM}px (mobile)`);

  await mPage.evaluate(() => document.getElementById("menu")?.scrollIntoView());
  await delay(700);
  await mPage.locator('button[aria-label="Add Loaded Fries to cart"]').first().tap();
  await delay(300);
  const mBadge = await mPage.evaluate(() => document.querySelector(".navbar__badge")?.textContent);
  mBadge === "1" ? ok("touch Add to Cart works") : bad("touch add badge = " + mBadge);

  const mTilt = await mPage.evaluate(
    () => document.querySelector(".menu-card").style.getPropertyValue("--tilt-rx")
  );
  mTilt === "" ? ok("no tilt styles from touch input") : bad("tilt set on touch: " + mTilt);
  await mCtx.close();

  /* ---------------- Reduced motion ---------------- */
  console.log("\n== prefers-reduced-motion: reduce ==");
  const rCtx = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    reducedMotion: "reduce",
  });
  const rPage = await newPage(rCtx);
  await rPage.goto(URL_ARG, { waitUntil: "domcontentloaded", timeout: 60000 });
  await rPage.waitForSelector(".menu-card", { timeout: 20000 });
  await delay(600);
  const rCheck = await rPage.evaluate(() => {
    const nodes = [...document.querySelectorAll("[data-reveal], [data-reveal-grid]")];
    const hidden = nodes.filter((n) => parseFloat(getComputedStyle(n).opacity) < 0.99);
    const heroImg = document.querySelector(".hero__bg img");
    return {
      active: document.documentElement.classList.contains("reveal-active"),
      hidden: hidden.length,
      heroAnim: heroImg ? getComputedStyle(heroImg).animationName : "none",
      heroDur: heroImg ? getComputedStyle(heroImg).animationDuration : "0s",
    };
  });
  !rCheck.active
    ? ok("reveal start-states disabled under reduced motion")
    : bad("reveal-active set under reduced motion");
  rCheck.hidden === 0
    ? ok("all content visible under reduced motion")
    : bad(`${rCheck.hidden} hidden under reduced motion`);
  rCheck.heroAnim === "none" || parseFloat(rCheck.heroDur) <= 1
    ? ok("hero zoom animation effectively disabled (duration ≤1ms)")
    : bad("hero anim = " + rCheck.heroAnim + " " + rCheck.heroDur);
  await rCtx.close();

  /* ---------------- Error summary ---------------- */
  console.log("\n== Runtime errors ==");
  const realConsole = consoleErrors.filter((e) => !/net::ERR_FAILED/.test(e));
  pageErrors.length === 0
    ? ok("no uncaught page errors")
    : bad("page errors: " + pageErrors.join(" || "));
  realConsole.length === 0
    ? ok("no console errors")
    : bad("console: " + realConsole.join(" || "));
} catch (err) {
  bad("script exception: " + (err && err.message ? err.message : String(err)));
} finally {
  await browser.close();
}

console.log(
  `\n${fails.length === 0 ? "ALL CHECKS PASSED" : `${fails.length} CHECK(S) FAILED`}\n`
);
process.exit(fails.length === 0 ? 0 : 1);