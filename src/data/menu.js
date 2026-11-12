/**
 * ---------------------------------------------------------------
 * MENU DATA — Al Haider Pizza House
 * ---------------------------------------------------------------
 * To add an item: copy any object below, give it a NEW unique `id`,
 * and it will automatically appear on the website (cards, filters,
 * search, cart and WhatsApp ordering all read from this file).
 *
 * Fields:
 *   id               : unique, URL/price-safe string (lowercase-with-dashes)
 *   name             : display name
 *   category         : must match a category id in `categories` below
 *   description      : short appetising line shown on the menu card
 *   image            : path inside /public (e.g. "/images/pizza-1.jpg")
 *   price            : single price in PKR (for items WITHOUT sizes)
 *   sizes            : array of { id, label, price } (pizzas) — price may be
 *                      null when a price is NOT yet confirmed; unavailable
 *                      sizes are shown disabled and cannot be ordered
 *   available        : set to false to hide the item from the menu
 *   featured         : true to show it in the "Popular Items" section
 *   discountEligible : false to exclude a single item from the 20% offer
 *
 * MENU VERIFICATION NOTES (printed menu photograph):
 *  - "Hot & Sever" (Soup) — item name is unclear in the photograph.
 *    Kept exactly as read, flagged needsConfirmation: true.
 *    To rename: edit the `name` field of id "hot-sever-soup".
 *  - Family Special Pizza — Large size price could not be reliably read
 *    from the photograph, so `price: null` is intentional. The Large
 *    option is disabled for ordering until the price is confirmed.
 *    All other pizza names/prices were taken from the supplied menu.
 *  - Cold Drinks: only "Mint Margarita" is confirmed on the menu
 *    photograph. Add further drinks here only after confirming
 *    their names and prices with the restaurant.
 * ---------------------------------------------------------------
 */

export let categories = [
  { id: "pizza", name: "Pizza", icon: "🍕", image: "/images/pizza-1.jpg" },
  { id: "burger", name: "Burgers", icon: "🍔", image: "/images/burger-1.jpg" },
  { id: "wrap", name: "Wraps & Rolls", icon: "🌯", image: "/images/wrap-1.jpg" },
  { id: "broast", name: "Broast", icon: "🍗", image: "/images/broast-1.jpg" },
  { id: "wings", name: "Wings & Nuggets", icon: "🔥", image: "/images/wings-1.jpg" },
  { id: "fries", name: "Fries & Momos", icon: "🍟", image: "/images/fries-1.jpg" },
  { id: "pasta", name: "Pasta", icon: "🍝", image: "/images/pasta-1.jpg" },
  { id: "sandwich", name: "Sandwiches", icon: "🥪", image: "/images/sandwich-1.jpg" },
  { id: "soup", name: "Soup", icon: "🍲", image: "/images/soup-1.jpg" },
  { id: "drink", name: "Cold Drinks", icon: "🥤", image: "/images/drink-1.jpg" },
];

/** Pizzas share this size set unless a price is missing (null = unavailable). */
const pizzaSizes = (small, medium, large) => [
  { id: "small", label: "Small", price: small },
  { id: "medium", label: "Medium", price: medium },
  { id: "large", label: "Large", price: large },
];

export let menuItems = [
  /* ============================= PIZZA ============================= */
  {
    id: "ah-special-pizza",
    name: "AH Special Pizza",
    category: "pizza",
    description: "Our signature house special loaded with chicken, cheese and signature AH seasoning.",
    image: "/images/pizza-1.jpg",
    sizes: pizzaSizes(650, 1200, 1650),
    available: true,
    featured: true,
  },
  {
    id: "kalaba-crust-pizza",
    name: "Kalaba Crust",
    category: "pizza",
    description: "Thick, cheese-stuffed crust pizza with a rich topping of grilled chicken.",
    image: "/images/pizza-2.jpg",
    sizes: pizzaSizes(600, 1100, 1550),
    available: true,
  },
  {
    id: "crown-crust-pizza",
    name: "Crown Crust",
    category: "pizza",
    description: "Royal crown edge stuffed with cheese bites, topped with chicken and herbs.",
    image: "/images/pizza-3.jpg",
    sizes: pizzaSizes(550, 1200, 1600),
    available: true,
  },
  {
    id: "turkish-pizza",
    name: "Turkish",
    category: "pizza",
    description: "Turkish-style pizza with spiced chicken, peppers and a smoky finish.",
    image: "/images/pizza-4.jpg",
    sizes: pizzaSizes(500, 1100, 1500),
    available: true,
  },
  {
    id: "cheese-lover-pizza",
    name: "Cheese Lover",
    category: "pizza",
    description: "Triple cheese blend over classic sauce — made for true cheese fans.",
    image: "/images/pizza-5.jpg",
    sizes: pizzaSizes(600, 1000, 1300),
    available: true,
  },
  {
    id: "chicken-bbq-pizza",
    name: "Chicken BBQ",
    category: "pizza",
    description: "Smoky BBQ chicken, onions and a tangy BBQ drizzle over melted cheese.",
    image: "/images/pizza-6.jpg",
    sizes: pizzaSizes(600, 1100, 1300),
    available: true,
  },
  {
    id: "chicken-fajita-pizza",
    name: "Chicken Fajita",
    category: "pizza",
    description: "Fajita-spiced chicken with onions, capsicum and jalapeño heat.",
    image: "/images/pizza-7.jpg",
    sizes: pizzaSizes(600, 1000, 1500),
    available: true,
  },
  {
    id: "calzone-pizza",
    name: "Calzone Pizza",
    category: "pizza",
    description: "Folded pizza pocket stuffed with chicken, cheese and creamy sauce.",
    image: "/images/pizza-8.jpg",
    sizes: pizzaSizes(550, 1000, 1300),
    available: true,
  },
  {
    id: "creamy-melt-pizza",
    name: "Creamy Melt",
    category: "pizza",
    description: "Creamy white-sauce pizza with chicken and an extra cheese pull.",
    image: "/images/pizza-2.jpg",
    sizes: pizzaSizes(600, 1100, 1500),
    available: true,
  },
  {
    id: "pepperoni-pizza",
    name: "Pepperoni Pizza",
    category: "pizza",
    description: "Classic pepperoni slices over rich tomato sauce and mozzarella.",
    image: "/images/pizza-3.jpg",
    sizes: pizzaSizes(550, 1100, 1500),
    available: true,
  },
  {
    id: "vegetable-pizza",
    name: "Vegetable Pizza",
    category: "pizza",
    description: "Fresh garden vegetables baked over cheese and tomato sauce.",
    image: "/images/pizza-4.jpg",
    sizes: pizzaSizes(550, 1000, 1300),
    available: true,
  },
  {
    id: "chicken-supreme-pizza",
    name: "Chicken Supreme",
    category: "pizza",
    description: "The full works — chicken, cheese, vegetables and supreme seasoning.",
    image: "/images/pizza-5.jpg",
    sizes: pizzaSizes(600, 1000, 1500),
    available: true,
  },
  {
    id: "chicken-lover-pizza",
    name: "Chicken Lover",
    category: "pizza",
    description: "Extra chicken, extra cheese, extra flavour for chicken fanatics.",
    image: "/images/pizza-6.jpg",
    sizes: pizzaSizes(550, 1000, 1300),
    available: true,
  },
  {
    id: "hot-spicy-pizza",
    name: "Hot & Spicy",
    category: "pizza",
    description: "Fiery chicken, chilli flakes and jalapeños for spice lovers.",
    image: "/images/pizza-7.jpg",
    sizes: pizzaSizes(500, 1000, 1300),
    available: true,
  },
  {
    id: "family-special-pizza",
    name: "Family Special Pizza",
    category: "pizza",
    description: "Big-family platter with our richest toppings — perfect for sharing.",
    image: "/images/pizza-8.jpg",
    // NOTE: Large price could NOT be reliably read from the printed menu
    // photograph → kept as null on purpose. The Large option appears
    // disabled and cannot be added to the cart until confirmed.
    sizes: pizzaSizes(1000, 2000, null),
    available: true,
    featured: true,
  },

  /* ============================= BURGERS ============================= */
  {
    id: "zinger-burger",
    name: "Zinger Burger",
    category: "burger",
    description: "Crispy fried chicken fillet with lettuce and signature mayo in a soft bun.",
    image: "/images/burger-1.jpg",
    price: 350,
    available: true,
    featured: true,
  },
  {
    id: "zinger-special-burger",
    name: "Zinger Special Burger",
    category: "burger",
    description: "Our upgraded zinger with extra crunch, cheese and special sauce.",
    image: "/images/burger-2.jpg",
    price: 450,
    available: true,
  },
  {
    id: "double-decker-burger",
    name: "Double Decker Burger",
    category: "burger",
    description: "Two juicy patties stacked with cheese, lettuce and sauce.",
    image: "/images/burger-3.jpg",
    price: 350,
    available: true,
  },
  {
    id: "tower-burger",
    name: "Tower Burger",
    category: "burger",
    description: "A tall tower of fried chicken, patty, cheese and fresh veggies.",
    image: "/images/burger-4.jpg",
    price: 500,
    available: true,
    featured: true,
  },
  {
    id: "patty-burger",
    name: "Patty Burger",
    category: "burger",
    description: "Simple and satisfying grilled patty with ketchup and fresh salad.",
    image: "/images/burger-5.jpg",
    price: 300,
    available: true,
  },
  {
    id: "crunchy-burger",
    name: "Crunchy Burger",
    category: "burger",
    description: "Extra crunchy fillet with tangy sauce and crisp lettuce.",
    image: "/images/burger-1.jpg",
    price: 350,
    available: true,
  },
  {
    id: "beef-patty-burger",
    name: "Beef Patty Burger",
    category: "burger",
    description: "Seasoned beef patty grilled to order with classic burger sauce.",
    image: "/images/burger-2.jpg",
    price: 350,
    available: true,
  },
  {
    id: "lava-burger",
    name: "Lava Burger",
    category: "burger",
    description: "Our biggest burger — molten cheese lava over double chicken layers.",
    image: "/images/burger-3.jpg",
    price: 700,
    available: true,
    featured: true,
  },
  /* ============================= PASTA ============================= */
  {
    id: "alfredo-pasta",
    name: "Alfredo Pasta",
    category: "pasta",
    description: "Creamy white-sauce pasta with chicken and a parmesan finish.",
    image: "/images/pasta-1.jpg",
    price: 700,
    available: true,
  },
  {
    id: "crunchy-pasta",
    name: "Crunchy Pasta",
    category: "pasta",
    description: "Pasta tossed in rich sauce and topped with crunchy golden chicken.",
    image: "/images/pasta-2.jpg",
    price: 750,
    available: true,
  },

  /* ============================= WRAPS & ROLLS ============================= */
  {
    id: "zinger-wrap",
    name: "Zinger Wrap",
    category: "wrap",
    description: "Crispy zinger strips wrapped with lettuce and mayo in a soft tortilla.",
    image: "/images/wrap-1.jpg",
    price: 380,
    available: true,
    featured: true,
  },
  {
    id: "chicken-wrap",
    name: "Chicken Wrap",
    category: "wrap",
    description: "Grilled chicken chunks with fresh veggies and creamy sauce.",
    image: "/images/wrap-2.jpg",
    price: 450,
    available: true,
  },
  {
    id: "turkish-roll",
    name: "Turkish Roll",
    category: "wrap",
    description: "Turkish-spiced chicken roll with garlic sauce and salad.",
    image: "/images/wrap-1.jpg",
    price: 400,
    available: true,
  },
  {
    id: "jumbo-roll",
    name: "Jumbo Roll",
    category: "wrap",
    description: "Extra-large roll packed with chicken, fries and signature sauce.",
    image: "/images/wrap-2.jpg",
    price: 500,
    available: true,
  },
  {
    id: "behari-roll",
    name: "Behari Roll",
    category: "wrap",
    description: "Smoky Behari-style spiced chicken with onions and mint chutney.",
    image: "/images/wrap-1.jpg",
    price: 650,
    available: true,
  },
  {
    id: "arabic-roll",
    name: "Arabic Roll",
    category: "wrap",
    description: "Arabic-style roll with grilled chicken, tahini and pickles.",
    image: "/images/wrap-2.jpg",
    price: 650,
    available: true,
  },

  /* ============================= WINGS & NUGGETS ============================= */
  {
    id: "hot-wings-5",
    name: "Hot Wings (5 pcs)",
    category: "wings",
    description: "Crispy wings tossed in our fiery hot sauce.",
    image: "/images/wings-1.jpg",
    price: 300,
    available: true,
    featured: true,
  },
  {
    id: "bbq-wings-5",
    name: "BBQ Wings (5 pcs)",
    category: "wings",
    description: "Glazed in smoky BBQ sauce and grilled to perfection.",
    image: "/images/wings-2.jpg",
    price: 350,
    available: true,
  },
  {
    id: "buffalo-wings-5",
    name: "Buffalo Wings (5 pcs)",
    category: "wings",
    description: "Classic buffalo-style wings with a tangy, buttery kick.",
    image: "/images/wings-1.jpg",
    price: 350,
    available: true,
  },
  {
    id: "pair-pair-wings-5",
    name: "Pair Pair Wings (5 pcs)",
    category: "wings",
    description: "Our special paired wings — double the flavour in every bite.",
    image: "/images/wings-2.jpg",
    price: 350,
    available: true,
  },
  {
    id: "nuggets-5",
    name: "Nuggets (5 pcs)",
    category: "wings",
    description: "Golden crispy chicken nuggets served with dip.",
    image: "/images/nuggets-1.jpg",
    price: 300,
    available: true,
  },

  /* ============================= FRIES & MOMOS ============================= */
  {
    id: "loaded-fries",
    name: "Loaded Fries",
    category: "fries",
    description: "Fries loaded with chicken, cheese sauce and our house drizzle.",
    image: "/images/fries-1.jpg",
    price: 800,
    available: true,
    featured: true,
  },
  {
    id: "pizza-fries",
    name: "Pizza Fries",
    category: "fries",
    description: "Fries baked under pizza sauce, cheese and chicken — pizza style.",
    image: "/images/fries-2.jpg",
    price: 800,
    available: true,
  },
  {
    id: "regular-fries",
    name: "Regular Fries",
    category: "fries",
    description: "Classic golden crispy fries with salt and seasoning.",
    image: "/images/fries-1.jpg",
    price: 250,
    available: true,
  },
  {
    id: "large-fries",
    name: "Large Fries",
    category: "fries",
    description: "Bigger portion of our classic crispy fries.",
    image: "/images/fries-2.jpg",
    price: 400,
    available: true,
  },
  {
    id: "momos-6",
    name: "Momos (6 pcs)",
    category: "fries",
    description: "Steamed momos stuffed with seasoned chicken, served with dip.",
    image: "/images/momo-1.jpg",
    price: 250,
    available: true,
  },
  {
    id: "momos-12",
    name: "Momos (12 pcs)",
    category: "fries",
    description: "A full dozen steamed momos — perfect for sharing.",
    image: "/images/momo-1.jpg",
    price: 500,
    available: true,
  },
  /* ============================= SANDWICHES ============================= */
  {
    id: "cheesy-sandwich",
    name: "Cheesy Sandwich",
    category: "sandwich",
    description: "Grilled sandwich overflowing with melted cheese and chicken.",
    image: "/images/sandwich-1.jpg",
    price: 700,
    available: true,
  },
  {
    id: "cheesy-stick",
    name: "Cheesy Stick",
    category: "sandwich",
    description: "Long cheesy sticks stuffed with chicken and molten cheese.",
    image: "/images/sandwich-2.jpg",
    price: 1200,
    available: true,
  },

  /* ============================= BROAST ============================= */
  {
    id: "full-broast",
    name: "Full Broast",
    category: "broast",
    description: "Full chicken broast — crispy outside, juicy inside, with fries.",
    image: "/images/broast-1.jpg",
    price: 1450,
    available: true,
    featured: true,
  },
  {
    id: "half-broast",
    name: "Half Broast",
    category: "broast",
    description: "Half chicken broast fried golden and served with dip.",
    image: "/images/broast-2.jpg",
    price: 750,
    available: true,
  },
  {
    id: "steam-broast",
    name: "Steam Broast",
    category: "broast",
    description: "Slow-steamed then lightly fried — tender to the bone.",
    image: "/images/broast-1.jpg",
    price: 1200,
    available: true,
  },
  {
    id: "broast-1-piece",
    name: "Broast (1 pc)",
    category: "broast",
    description: "Single piece of our signature crispy broast.",
    image: "/images/broast-2.jpg",
    price: 200,
    available: true,
  },

  /* ============================= SOUP ============================= */
  {
    id: "special-soup",
    name: "Special Soup",
    category: "soup",
    description: "Our house special soup loaded with chicken and vegetables.",
    image: "/images/soup-1.jpg",
    price: 350,
    available: true,
  },
  {
    id: "chicken-corn-soup",
    name: "Chicken Corn Soup",
    category: "soup",
    description: "Warm, comforting classic chicken corn soup.",
    image: "/images/soup-2.jpg",
    price: 300,
    available: true,
  },
  {
    // ⚠️ NAME UNCLEAR in the printed menu photograph — kept exactly as read
    // and flagged. To rename, edit ONLY the `name` value below
    // (e.g. "Hot & Sour Soup"). No other change is needed anywhere else.
    id: "hot-sever-soup",
    name: "Hot & Sever",
    category: "soup",
    description: "Hot and hearty soup with a peppery kick.",
    image: "/images/soup-1.jpg",
    price: 250,
    available: true,
    needsConfirmation: true,
  },

  /* ============================= COLD DRINKS ============================= */
  // Cold Drinks confirmed from the printed menu photograph (November 2026).
  // Sizes are grouped under one product where the same drink is sold in
  // multiple pack sizes — customers pick a size pill before adding to cart.
  //
  // ⚠️ UNCLEAR / NEEDS CONFIRMATION:
  //  - "Pepsi" priced at Rs. 170 appears on the menu photo with an unclear
  //    size. Kept as a separate flagged item — do not merge with Pepsi 1 Ltr
  //    until the size is confirmed by the restaurant.
  //  - One item on the photo shows Rs. 0 — intentionally NOT added (not
  //    purchasable, no price to confirm).
  //
  // ⚠️ POSSIBLE DUPLICATES:
  //  - Next Cola Small (Rs. 70) and Next Cola Regular (Rs. 70) have the same
  //    price — may be the same item listed twice on the photo. Kept separate
  //    until confirmed.
  //  - Pepsi 1 Ltr (Rs. 170) and the flagged "Pepsi" (Rs. 170, unclear size)
  //    may be the same item. Flagged item kept separate pending confirmation.

  {
    id: "mint-margarita",
    name: "Mint Margarita",
    category: "drink",
    description: "Chilled blended mint margarita — cool, refreshing and zesty.",
    image: "/images/drink-1.webp",
    price: 200,
    available: true,
  },

  /* --- Pepsi --- */
  {
    id: "pepsi",
    name: "Pepsi",
    category: "drink",
    description: "Chilled Pepsi soft drink.",
    image: "/images/pepsi-bottle.webp",
    sizes: [
      { id: "can", label: "Can", price: 120 },
      { id: "1l", label: "1 Ltr", price: 170 },
      { id: "1.5l", label: "1.5 Ltr", price: 200 },
    ],
    available: true,
  },
  {
    // ⚠️ SIZE UNCLEAR on the printed menu photograph — flagged for confirmation.
    // Do NOT merge with the Pepsi product above until the size is verified.
    id: "pepsi-unclear-size",
    name: "Pepsi",
    category: "drink",
    description: "Pepsi soft drink — size to be confirmed.",
    image: "/images/pepsi-bottle.webp",
    price: 170,
    available: true,
    needsConfirmation: true,
  },

  /* --- 7Up --- */
  {
    id: "7up",
    name: "7Up",
    category: "drink",
    description: "Chilled 7Up lemon-lime soft drink.",
    image: "/images/7up-bottle.webp",
    sizes: [
      { id: "regular", label: "Regular", price: 80 },
      { id: "can", label: "Can", price: 120 },
      { id: "1l", label: "1 Liter", price: 170 },
    ],
    available: true,
  },

  /* --- Sprite --- */
  {
    id: "sprite",
    name: "Sprite",
    category: "drink",
    description: "Chilled Sprite lemon-lime soft drink.",
    image: "/images/sprite-bottle.webp",
    price: 170,
    available: true,
  },

  /* --- Sting --- */
  {
    id: "sting",
    name: "Sting",
    category: "drink",
    description: "Chilled Sting energy drink.",
    image: "/images/sting-bottle.webp",
    price: 150,
    available: true,
  },

  /* --- Next Cola --- */
  {
    id: "next-cola",
    name: "Next Cola",
    category: "drink",
    description: "Chilled Next Cola soft drink.",
    image: "/images/next-cola-bottle.webp",
    sizes: [
      { id: "small", label: "Small", price: 70 },
      { id: "regular", label: "Regular", price: 70 },
      { id: "large", label: "Large", price: 150 },
    ],
    available: true,
  },
  {
    // ⚠️ POSSIBLE DUPLICATE: same price as Next Cola Small (Rs. 70). May be
    // the same item listed twice on the menu photo. Kept separate pending
    // confirmation from the restaurant.
    id: "next-cola-regular-dup",
    name: "Next Cola Regular",
    category: "drink",
    description: "Next Cola soft drink — regular size.",
    image: "/images/next-cola-bottle.webp",
    price: 70,
    available: true,
    needsConfirmation: true,
  },

  /* --- Water --- */
  {
    id: "water",
    name: "Water",
    category: "drink",
    description: "Bottled drinking water.",
    image: "/images/water-bottle-small.webp",
    sizes: [
      { id: "small", label: "Small", price: 30 },
      { id: "large", label: "Large", price: 100 },
    ],
    available: true,
  },

  /* --- Pizup --- */
  {
    id: "pizup",
    name: "Pizup",
    category: "drink",
    description: "Chilled Pizup soft drink.",
    image: "/images/pizup-bottle.webp",
    price: 140,
    available: true,
  },
];

/**
 * Items visible on the website (available only).
 * Reassigned by setMenuData() when the admin panel pushes live content.
 */
export let availableItems = menuItems.filter((item) => item.available !== false);

/**
 * Replace the menu with content loaded from the database.
 *
 * The arrays are MUTATED IN PLACE (and the exported bindings reassigned)
 * so that every module that imported `menuItems` / `availableItems`
 * keeps working and immediately sees the new content — ES module
 * live bindings propagate the reassignment to all importers.
 */
export function setMenuData(nextItems, nextCategories) {
  if (Array.isArray(nextItems)) {
    menuItems = nextItems;
    availableItems = nextItems.filter((item) => item.available !== false);
  }
  if (Array.isArray(nextCategories)) {
    categories = nextCategories;
  }
}

/** Find a menu item by its id. */
export function getMenuItem(id) {
  return menuItems.find((item) => item.id === id) || null;
}

/** Look up a category by id (fallback: plain object with the id as name). */
export function getCategory(id) {
  return categories.find((cat) => cat.id === id) || { id, name: id, icon: "🍽️" };
}
