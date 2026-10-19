# 🔥 Al Haider Pizza House — Website

**Big Bites. Bold Flavours.**
Official website for **Al Haider Pizza House** — Opposite UET, Charsadda Chowk, Mardan, Pakistan.
Phone / WhatsApp: **0339-5509755** (`923395509755`)

Modern, responsive restaurant website built with **React + Vite**, featuring a full searchable menu,
a live shopping cart (saved in the browser), a real time-limited **20% OFF** offer system, a checkout
form, and one-tap **WhatsApp ordering**. No backend, no database, no API keys required.

---

## 1. Install dependencies

Make sure [Node.js](https://nodejs.org) (v18 or newer) is installed, then run **once**:

```powershell
cd "c:\Users\user\Desktop\Al haider cafe"
npm install
```

## 2. Run the website locally (development)

```powershell
npm run dev
```

Open the printed address (usually http://localhost:5173) in your browser.

## 3. Create a production build

```powershell
npm run build
```

Output goes to the `dist/` folder. To preview the production build locally:

```powershell
npm run preview
```

You can upload the contents of `dist/` to any static host (Netlify, Vercel, GitHub Pages, shared hosting).

## 4. Run automated tests

```powershell
npm test
```

This runs **all** automated tests:

- `tests/offerStatus.test.js` + `tests/pricing.test.js` (Node's built-in test runner):
  offer boundary timing — **1 second before expiry = active**, **exactly at
  `2026-10-31T23:59:00+05:00` = inactive**, **after = inactive** — plus discount
  maths and rounding.
- `tests/menuCard.test.jsx` (Vitest + Testing Library): Add to Cart never opens a
  new tab or navigates, cart badge/persistence, quantity controls, removal,
  and the cart drawer.

Optional real-browser (headless Chrome) checks — add-to-cart/new-tab regression
(`scripts/click-test.mjs`) and checkout → WhatsApp order flow (`scripts/checkout-test.mjs`):

```powershell
node scripts/click-test.mjs
node scripts/checkout-test.mjs
```

---

## 5. How to change food prices

Open **`src/data/menu.js`**.

- For burgers, fries, drinks, etc. — change the `price` value:

```js
{
  id: "zinger-burger",
  name: "Zinger Burger",
  price: 350,          // ← change this
  ...
}
```

- For pizzas — change the numbers passed to `pizzaSizes(small, medium, large)`:

```js
sizes: pizzaSizes(650, 1200, 1650),  // Small, Medium, Large (Rs.)
```

Save the file — the site updates automatically. **Never** store a discounted price here; keep
original prices only (the offer system derives discounts itself).

## 6. How to add a new menu item

Copy any item in `src/data/menu.js`, give it a **new unique `id`**, save. It appears automatically
in the menu grid, search, category filter, cart and WhatsApp message. Example:

```js
{
  id: "chicken-tikka-pizza",        // must be unique
  name: "Chicken Tikka Pizza",
  category: "pizza",                // pizza | burger | wrap | broast | wings | fries | pasta | sandwich | soup | drink
  description: "Spiced tikka chicken with onions and cheese.",
  image: "/images/pizza-3.jpg",
  sizes: pizzaSizes(600, 1150, 1550),   // or use `price: 400` for single-price items
  available: true,                  // set false to hide
  featured: true,                   // optional: shows in "Popular Items"
},
```

To add a **new category**, add it to the `categories` array at the top of the same file.

## 7. How to replace a food image

1. Put your photo in **`public/images/`** (e.g. `pizza-new.jpg`, ideally ~900px wide, under 200 KB).
2. Point the item's `image` field to it: `image: "/images/pizza-new.jpg"`.
3. If an image file is missing or fails to load, the site automatically shows a branded placeholder — never a broken image icon.

## 8. How to mark an item unavailable

In `src/data/menu.js` set `available: false`. The item disappears from the menu, search, and
ordering. Change it back to `true` to restore it.

## 9. How to change or disable the 20% offer

Open **`src/data/offer.js`**:

```js
export const offerConfig = {
  enabled: true,                    // ← set false to turn the offer OFF instantly
  discountPercent: 20,              // ← e.g. 10 for 10% OFF
  startDate: null,                  // null = starts immediately
  endDate: "2026-10-31T23:59:00+05:00",
  title: "Limited-Time Offer",
  description: "Get 20% OFF at Al Haider Pizza House!",
  applyToAllItems: true,            // false = only items with discountEligible: true
};
```

- The banner, "20% OFF" badges, discounted prices, cart totals and WhatsApp messages all follow this file.
- After expiry the banner hides and **all prices automatically revert to normal** — everywhere, instantly.
- To exclude one item from the discount, add `discountEligible: false` to that item in `menu.js`.

## 10. How to set a new offer expiry date (Asia/Karachi time)

**Always include `+05:00`** so the expiry is exact regardless of the visitor's device timezone:

```js
endDate: "2026-12-31T23:59:00+05:00",   // 31 Dec 2026, 11:59 PM Pakistan time
```

The offer is active strictly *before* that timestamp and inactive *at* it. Never write a bare date
like `"2026-12-31T23:59:00"` — the site refuses offset-less dates to avoid timezone bugs.

## 11. How to test WhatsApp ordering

1. Run `npm run dev`, add items to the cart, press **Checkout**, fill in name, phone, order type
   (and address for delivery), then **Confirm Order on WhatsApp**.
2. WhatsApp opens (`https://wa.me/923395509755?text=…`) with the complete order message prefilled.
3. The customer must press **Send** — no order is claimed as placed before that.
4. If the browser blocks the popup, the site shows a fallback panel with a manual
   "Open WhatsApp & Send Order" button and a copyable message.

---

## Project structure

```text
Al haider cafe/
  public/images/          ← all food photos + favicon.svg (logo)
  scripts/                ← download-images.ps1 (utility)
  src/
    components/           ← Navbar, Hero, OfferBanner, MenuCard, CategoryFilter,
                             MenuSection, PopularItems, About, WhyChooseUs,
                             Contact, Footer, CartDrawer, CheckoutForm, Logo, FoodImage
    context/CartContext.jsx   ← cart state + localStorage persistence
    data/menu.js              ← ALL menu items, prices, images, categories
    data/offer.js             ← ALL offer/discount configuration
    data/site.js              ← name, phone, WhatsApp number, address
    hooks/useOfferStatus.js   ← live offer clock (auto-expiry)
    styles/                   ← variables.css, base.css, sections.css, cart.css
    utils/pricing.js          ← PKR formatting + discount maths (shared everywhere)
    utils/offerStatus.js      ← offer active/inactive rules
    utils/whatsapp.js         ← order message builder + wa.me link
    App.jsx  main.jsx
  tests/                  ← node:test suites (offer boundary + pricing)
  index.html  package.json  vite.config.js  README.md
```

## Deployment (live)

The site is deployed on **Vercel** and is publicly accessible 24/7 (no laptop needed):

**https://al-haider-pizza-house.vercel.app**

- Hosted project: `al-haider-pizza-house` (Vercel, free Hobby plan)
- `vercel.json` runs `npm run build` and serves the `dist/` folder with SPA rewrites

### Recommended workflow (after one-time Git setup — see below)

1. Ask Cline for the change → Cline implements and verifies it
   (`npm test` + `npm run build` + review).
2. Verified changes are committed and pushed to the production branch (`main`).
3. Vercel automatically builds and deploys to the live URL.

> **One-time setup still required:** run `gh auth login` (GitHub CLI) and tell Cline
> to create/push to a GitHub repository, then connect that repository to this Vercel
> project in the dashboard (Project → Settings → Git). Until then, use the CLI below.

### Manual CLI deployment (works today, no GitHub needed)

```powershell
npm run deploy
```

Equivalent to:

```powershell
npm test          # must pass first — never deploy broken code
npm run build
vercel deploy --prod --yes
```

The Vercel CLI on this machine is already logged in — no tokens needed.
Never commit `.env` files, API keys or `node_modules`.


- Menu data was transcribed from the supplied printed-menu photographs.
  Two items are flagged for confirmation inside `menu.js`: **"Hot & Sever"** (soup name unclear)
  and **Family Special Pizza — Large** (price unreadable → Large is disabled until confirmed).
- No online payment: customers pay on delivery/pickup; orders arrive via WhatsApp.
- Works offline for assets — all images are local; Google Fonts falls back to system fonts if offline.
