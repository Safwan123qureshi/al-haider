import { isSupabaseConfigured, supabase } from "./supabase.js";
import { categories as staticCategories, menuItems as staticMenuItems } from "../data/menu.js";
import { offerConfig as staticOfferConfig } from "../data/offer.js";
import { applyLiveContent } from "./contentStore.js";

/**
 * Snapshot of the built-in content, taken at module load.
 *
 * `menuItems` / `categories` / `offerConfig` are live bindings that get
 * reassigned when live content is applied, so the fallback needs its
 * own copy taken before the first apply.
 */
const DEFAULT_CATEGORIES = [...staticCategories];
const DEFAULT_ITEMS = [...staticMenuItems];
const DEFAULT_OFFER = { ...staticOfferConfig };


/**
 * Admin data layer.
 *
 * Every read falls back to the static files in src/data/ so the PUBLIC
 * website keeps working even if Supabase is unreachable or unconfigured.
 * Writes only ever work when Supabase is configured AND the signed-in
 * user is an active admin (enforced by RLS on the server, not here).
 */

/** Map a DB row -> the shape the website already expects. */
function mapItem(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description || "",
    image: row.image || null,
    price: row.price == null ? null : Number(row.price),
    sizes: Array.isArray(row.sizes)
      ? row.sizes.map((s) => ({
          id: s.id,
          label: s.label,
          price: s.price == null ? null : Number(s.price),
        }))
      : [],
    available: row.available !== false,
    featured: Boolean(row.featured),
    discountEligible: row.discount_eligible !== false,
    needsConfirmation: Boolean(row.needs_confirmation),
    // Kept so a partial update never silently resets the display order.
    sortOrder: Number(row.sort_order) || 0,
  };
}

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || "🍽️",
    image: row.image || null,
  };
}

/** Map the single `offers` row -> the offerConfig shape used site-wide. */
function mapOffer(row) {
  if (!row) return { ...DEFAULT_OFFER };
  return {
    enabled: Boolean(row.enabled),
    discountPercent: Number(row.discount_percent) || 0,
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    title: row.title || "Limited-Time Offer",
    description: row.description || "",
    applyToAllItems: row.apply_to_all !== false,
  };
}

/** Fetch menu categories, items and the offer row. Never throws. */
export async function loadAdminData() {
  if (!isSupabaseConfigured) {
    return {
      categories: DEFAULT_CATEGORIES,
      items: DEFAULT_ITEMS,
      offer: { ...DEFAULT_OFFER },
      source: "static",
      error: null,
    };
  }

  try {
    const [catsRes, itemsRes, offerRes] = await Promise.all([
      supabase.from("menu_categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("menu_items").select("*").order("sort_order", { ascending: true }),
      supabase.from("offers").select("*").limit(1).maybeSingle(),
    ]);

    if (catsRes.error) throw catsRes.error;
    if (itemsRes.error) throw itemsRes.error;
    if (offerRes.error) throw offerRes.error;

    const dbCategories = (catsRes.data || []).map(mapCategory);
    const dbItems = (itemsRes.data || []).map(mapItem);

    // SAFETY NET: an empty table must never blank the public website.
    // A freshly provisioned project (migration not yet applied) or an
    // accidentally emptied table would otherwise wipe the whole menu.
    // Fall back to the static content instead.
    //
    // MERGE STRATEGY: database items override static items by ID, but static
    // items that are not in the database are always kept. This ensures the
    // built-in Cold Drinks (and all other static items) always appear on the
    // public site even if the database only has a subset of menu items.
    const dbCatMap = new Map(dbCategories.map((cat) => [cat.id, cat]));
    const mergedCategories = [...DEFAULT_CATEGORIES];
    dbCategories.forEach((dbCat) => {
      const idx = mergedCategories.findIndex((c) => c.id === dbCat.id);
      if (idx >= 0) mergedCategories[idx] = dbCat;
      else mergedCategories.push(dbCat);
    });

    const dbItemMap = new Map(dbItems.map((item) => [item.id, item]));
    const mergedItems = [...DEFAULT_ITEMS];
    dbItems.forEach((dbItem) => {
      const idx = mergedItems.findIndex((i) => i.id === dbItem.id);
      if (idx >= 0) mergedItems[idx] = dbItem;
      else mergedItems.push(dbItem);
    });

    const categories = mergedCategories.length ? mergedCategories : DEFAULT_CATEGORIES;
    const items = mergedItems.length ? mergedItems : DEFAULT_ITEMS;

    return {
      categories,
      items,
      offer: mapOffer(offerRes.data),
      source: dbCategories.length && dbItems.length ? "database" : "static",
      error:
        dbCategories.length && dbItems.length
          ? null
          : "The database has no menu content yet — showing the built-in menu.",
    };
  } catch (err) {
    console.error("[Al Haider] Failed to load menu data, using static fallback:", err);
    return {
      categories: DEFAULT_CATEGORIES,
      items: DEFAULT_ITEMS,
      offer: { ...DEFAULT_OFFER },
      source: "static",
      error: err?.message || "Could not load data from the database.",
    };
  }
}

/**
 * Load the public menu/offer content and push it into the shared
 * data modules so every consumer (menu grid, offer banner, pricing,
 * cart, WhatsApp message) immediately reflects the database.
 *
 * Never throws — on failure the static content stays in place.
 *
 * @returns {Promise<{categories: Array, items: Array, offer: object,
 *                    source: string, error: string|null}>}
 */
export async function loadPublicContent() {
  const data = await loadAdminData();
  applyLiveContent({
    categories: data.categories,
    items: data.items,
    offer: data.offer,
  });
  return data;
}


/* ============================================================
 * WRITES — all guarded by RLS (active admin only).
 * ============================================================ */

function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Check your environment variables.");
  }
  return supabase;
}

/**
 * Website field name -> `menu_items` column name.
 *
 * Used to build both full rows (inserts) and partial rows (updates).
 */
const ITEM_COLUMNS = {
  name: "name",
  category: "category",
  description: "description",
  image: "image",
  price: "price",
  sizes: "sizes",
  available: "available",
  featured: "featured",
  discountEligible: "discount_eligible",
  needsConfirmation: "needs_confirmation",
  sortOrder: "sort_order",
};

/** Normalise one website-shaped value for storage. */
function toColumnValue(key, value) {
  switch (key) {
    case "price":
      return value == null || value === "" ? null : Number(value);
    case "sizes":
      return Array.isArray(value)
        ? value.map((s) => ({
            id: s.id,
            label: s.label,
            price: s.price == null || s.price === "" ? null : Number(s.price),
          }))
        : [];
    case "description":
      return value || "";
    case "image":
      return value || null;
    case "available":
      return value !== false;
    case "featured":
      return Boolean(value);
    case "discountEligible":
      return value !== false;
    case "needsConfirmation":
      return Boolean(value);
    case "sortOrder":
      return Number(value) || 0;
    default:
      return value;
  }
}

/**
 * Build a PARTIAL DB row — ONLY the fields the caller actually provided.
 *
 * Anything omitted is left untouched in the database. This is what stops
 * a partial change (e.g. toggling `available`) from wiping the columns
 * the caller did not mention, and what keeps `sort_order` intact when
 * the admin form does not carry it.
 */
function toItemPatch(item) {
  const patch = {};
  Object.keys(ITEM_COLUMNS).forEach((key) => {
    if (item[key] !== undefined) {
      patch[ITEM_COLUMNS[key]] = toColumnValue(key, item[key]);
    }
  });
  return patch;
}

/**
 * Convert a website-shaped item into a FULL DB row (used for inserts).
 * Missing fields fall back to the column defaults.
 */
function toItemRow(item) {
  const patch = toItemPatch(item);
  return {
    id: item.id,
    name: patch.name ?? "",
    category: patch.category ?? "",
    description: patch.description ?? "",
    image: patch.image ?? null,
    price: patch.price ?? null,
    sizes: patch.sizes ?? [],
    available: patch.available ?? true,
    featured: patch.featured ?? false,
    discount_eligible: patch.discount_eligible ?? true,
    needs_confirmation: patch.needs_confirmation ?? false,
    sort_order: patch.sort_order ?? 0,
  };
}

/**
 * Create a new menu item. Returns the created row.
 *
 * When no explicit `sortOrder` is given the item is appended to the END
 * of its category, so new dishes do not jump to the top of the menu.
 */
export async function createMenuItem(item) {
  const client = requireSupabase();
  let sortOrder = Number(item?.sortOrder);

  if (!Number.isFinite(sortOrder)) {
    const { data, error } = await client
      .from("menu_items")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    if (error) throw error;
    sortOrder = (Number(data?.[0]?.sort_order) || 0) + 1;
  }

  const { data, error } = await client
    .from("menu_items")
    .insert(toItemRow({ ...item, sortOrder }))
    .select()
    .single();
  if (error) throw error;
  return mapItem(data);
}

/**
 * Update an existing menu item by id.
 *
 * `changes` may be a FULL item (all fields replaced) or a PARTIAL patch
 * (only the provided keys are written). Only the keys actually present in
 * `changes` are written, so omitted columns — notably `sort_order` — keep
 * their current value. `id` is always taken from the `id` argument so the
 * row can never be re-keyed by accident.
 */
export async function updateMenuItem(id, changes) {
  const row = { ...toItemPatch(changes || {}), id };

  const { data, error } = await requireSupabase()
    .from("menu_items")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapItem(data);
}

/** Delete a menu item by id. */
export async function deleteMenuItem(id) {
  const { error } = await requireSupabase().from("menu_items").delete().eq("id", id);
  if (error) throw error;
}

/** Update a category's display name / icon / image. */
export async function updateCategory(id, changes) {
  const patch = {
    name: changes.name,
    icon: changes.icon || null,
    image: changes.image || null,
  };
  const { data, error } = await requireSupabase()
    .from("menu_categories")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapCategory(data);
}

/** Save the promotional offer settings (single-row table). */
export async function saveOffer(offer) {
  const { data, error } = await requireSupabase()
    .from("offers")
    .upsert(
      {
        id: true,
        enabled: Boolean(offer.enabled),
        discount_percent: Number(offer.discountPercent) || 0,
        start_date: offer.startDate || null,
        end_date: offer.endDate || null,
        title: offer.title || "Limited-Time Offer",
        description: offer.description || "",
        apply_to_all: offer.applyToAllItems !== false,
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error) throw error;
  return mapOffer(data);
}
