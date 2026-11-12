/**
 * Regression tests for the admin panel data layer.
 *
 * Covers the bugs that could take the PUBLIC website down:
 *  1. an empty `menu_items` / `menu_categories` table must NOT blank the menu
 *     (it falls back to the built-in static content instead);
 *  2. `applyLiveContent` must ignore an empty array for the same reason;
 *  3. a partial menu-item update must NOT reset `sort_order`;
 *  4. a new menu item must be appended to the end, not inserted at position 0.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/** A tiny chainable stub that mimics the Supabase query builder. */
function createClient(tables) {
  const calls = { inserts: [], updates: [], selects: [] };

  const client = {
    calls,
    from(table) {
      const q = {
        _table: table,
        _selectCols: null,
        select(cols) {
          q._selectCols = cols;
          calls.selects.push({ table, cols });
          return q;
        },
        order() {
          return q;
        },
        limit() {
          return q;
        },
        maybeSingle() {
          return q;
        },
        eq() {
          return q;
        },
        insert(row) {
          calls.inserts.push({ table, row });
          return q;
        },
        update(row) {
          calls.updates.push({ table, row });
          return q;
        },
        single() {
          return q;
        },
        then(resolve, reject) {
          const entry = tables[table];
          const result =
            typeof entry === "function"
              ? entry(q, calls)
              : entry ?? { data: [], error: null };
          return Promise.resolve(result).then(resolve, reject);
        },
      };
      return q;
    },
  };

  return client;
}

let client;

// Mock the Supabase client before `adminData.js` is imported.
vi.mock("../src/lib/supabase.js", () => ({
  isSupabaseConfigured: true,
  supabase: {
    get from() {
      return (table) => client.from(table);
    },
  },
  setupFunctionUrl: "https://example.supabase.co/functions/v1/redeem-setup",
}));

const { loadAdminData, createMenuItem, updateMenuItem } = await import(
  "../src/lib/adminData.js"
);
const { applyLiveContent } = await import("../src/lib/contentStore.js");
const menuModule = await import("../src/data/menu.js");

/**
 * Snapshot of the built-in content, taken BEFORE any test mutates it.
 * `menu.js` uses live ES-module bindings, so the exported arrays are
 * reassigned by `setMenuData()` — a snapshot is the only reliable way
 * to restore the originals.
 */
const ORIGINAL = {
  categories: [...menuModule.categories],
  items: [...menuModule.menuItems],
};

const EMPTY_TABLES = {
  menu_categories: { data: [], error: null },
  menu_items: { data: [], error: null },
  offers: { data: null, error: null },
};

beforeEach(() => {
  client = createClient(EMPTY_TABLES);
});

afterEach(() => {
  // Always put the built-in content back.
  applyLiveContent({ categories: ORIGINAL.categories, items: ORIGINAL.items });
});

describe("loadAdminData — an empty database must never blank the menu", () => {
  it("falls back to the built-in menu when the tables are empty", async () => {
    const data = await loadAdminData();

    expect(data.source).toBe("static");
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.categories.length).toBeGreaterThan(0);
    expect(data.error).toMatch(/no menu content/i);
  });

  it("falls back to the built-in menu when only menu_items is empty", async () => {
    client = createClient({
      menu_categories: {
        data: [{ id: "pizza", name: "Pizza", icon: "🍕", sort_order: 1 }],
        error: null,
      },
      menu_items: { data: [], error: null },
      offers: { data: null, error: null },
    });

    const data = await loadAdminData();
    expect(data.source).toBe("static");
    expect(data.items.length).toBeGreaterThan(0);
  });

  it("uses the database content when it exists", async () => {
    client = createClient({
      menu_categories: {
        data: [{ id: "pizza", name: "Pizza", icon: "🍕", sort_order: 1 }],
        error: null,
      },
      menu_items: {
        data: [
          {
            id: "test-pizza",

            name: "Test Pizza",
            category: "pizza",
            price: 500,
            sort_order: 1,
          },
        ],
        error: null,
      },
      offers: { data: null, error: null },
    });

    const data = await loadAdminData();
    expect(data.source).toBe("database");
    expect(data.error).toBeNull();
    // Database items are merged with static items (DB overrides by ID,
    // static items fill gaps). So we expect static items + the new DB item.
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items.find((i) => i.id === "test-pizza")).toMatchObject({
      id: "test-pizza",
      name: "Test Pizza",
      category: "pizza",
    });
    // Static items are still present (e.g. Mint Margarita)
    expect(data.items.find((i) => i.id === "mint-margarita")).toBeTruthy();
  });

  it("falls back to the built-in menu when the query errors", async () => {
    client = createClient({
      menu_categories: { data: null, error: new Error("boom") },
      menu_items: { data: [], error: null },
      offers: { data: null, error: null },
    });

    const data = await loadAdminData();
    expect(data.source).toBe("static");
    expect(data.items.length).toBeGreaterThan(0);
  });
});

describe("applyLiveContent — empty content is ignored", () => {
  it("does not wipe the published menu when items is an empty array", () => {
    const before = menuModule.availableItems.length;
    expect(before).toBeGreaterThan(0);

    applyLiveContent({ categories: [], items: [] });

    expect(menuModule.availableItems.length).toBe(before);
    expect(menuModule.menuItems.length).toBe(before);
  });

  it("still applies real content", () => {
    applyLiveContent({
      categories: [{ id: "drink", name: "Cold Drinks", icon: "🥤" }],
      items: [
        {
          id: "test-drink",
          name: "Test Drink",
          category: "drink",
          price: 100,
          available: true,
        },
      ],
    });

    expect(menuModule.availableItems).toHaveLength(1);
    expect(menuModule.availableItems[0].name).toBe("Test Drink");
  });
});

describe("updateMenuItem — a partial update must not reset sort_order", () => {
  it("writes only the fields that were provided", async () => {
    client = createClient(EMPTY_TABLES);
    await updateMenuItem("zinger-burger", { available: false });

    const row = client.calls.updates[0].row;
    expect(row.id).toBe("zinger-burger");
    expect(row.available).toBe(false);
    expect(row).not.toHaveProperty("sort_order");
    expect(row).not.toHaveProperty("name");
    expect(row).not.toHaveProperty("price");
  });

  it("keeps the current sort_order when it is supplied", async () => {
    client = createClient(EMPTY_TABLES);
    await updateMenuItem("zinger-burger", { available: false, sortOrder: 17 });

    const row = client.calls.updates[0].row;
    expect(row.sort_order).toBe(17);
  });

  it("maps the website field names onto the database columns", async () => {
    client = createClient(EMPTY_TABLES);
    await updateMenuItem("zinger-burger", {
      name: "Zinger Burger XL",
      discountEligible: false,
      needsConfirmation: true,
    });

    const row = client.calls.updates[0].row;
    expect(row.name).toBe("Zinger Burger XL");
    expect(row.discount_eligible).toBe(false);
    expect(row.needs_confirmation).toBe(true);
  });

  it("never re-keys the row from the payload", async () => {
    client = createClient(EMPTY_TABLES);
    await updateMenuItem("zinger-burger", { id: "hacked-id", name: "X" });

    expect(client.calls.updates[0].row.id).toBe("zinger-burger");
  });
});

describe("createMenuItem — new items go to the end of the menu", () => {
  it("appends when no sort order is given", async () => {
    client = createClient({
      ...EMPTY_TABLES,
      menu_items: (q) => {
        // The "current maximum sort_order" lookup.
        if (q._selectCols === "sort_order") {
          return { data: [{ sort_order: 52 }], error: null };
        }
        return { data: [], error: null };
      },
    });

    await createMenuItem({
      id: "new-item",
      name: "New Item",
      category: "pizza",
      description: "",
      price: 100,
      sizes: [],
      available: true,
    });

    const row = client.calls.inserts[0].row;
    expect(row.id).toBe("new-item");
    expect(row.sort_order).toBe(53);
  });

  it("uses an explicit sort order when one is supplied", async () => {
    client = createClient(EMPTY_TABLES);
    await createMenuItem({
      id: "new-item",
      name: "New Item",
      category: "pizza",
      description: "",
      price: 100,
      sizes: [],
      available: true,
      sortOrder: 3,
    });

    expect(client.calls.inserts[0].row.sort_order).toBe(3);
  });
});
