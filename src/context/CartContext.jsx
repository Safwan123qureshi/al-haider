import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMenuItem } from "../data/menu.js";
import { computeCartSummary } from "../utils/pricing.js";
import { useOfferStatus } from "../hooks/useOfferStatus.js";

const STORAGE_KEY = "alhaider_cart_v1";
const CartContext = createContext(null);

/** Cart entries are stored as { id, size, qty } — prices are NEVER stored. */
function loadStoredCart() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e) => e && typeof e.id === "string");
  } catch {
    return [];
  }
}

function saveStoredCart(entries) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* storage unavailable (private mode) — cart still works in memory */
  }
}

const variantKey = (id, size) => `${id}::${size || "-"}`;

export function CartProvider({ children }) {
  const { offerStatus, refreshOffer } = useOfferStatus();
  const [entries, setEntries] = useState(loadStoredCart);
  const [isCartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    saveStoredCart(entries);
  }, [entries]);

  // Drop items removed/hidden in menu data after a refresh.
  const lines = useMemo(
    () =>
      entries
        .map((entry) => ({
          key: variantKey(entry.id, entry.size),
          id: entry.id,
          size: entry.size || null,
          quantity: Math.max(1, parseInt(entry.qty, 10) || 1),
          item: getMenuItem(entry.id),
        }))
        .filter((line) => line.item && line.item.available !== false),
    [entries]
  );

  const summary = useMemo(
    () => computeCartSummary(lines, offerStatus),
    [lines, offerStatus]
  );

  const addItem = useCallback((item, size = null, quantity = 1) => {
    if (!item || item.available === false) return;
    setEntries((prev) => {
      const key = variantKey(item.id, size);
      const existing = prev.find((e) => variantKey(e.id, e.size) === key);
      if (existing) {
        return prev.map((e) =>
          variantKey(e.id, e.size) === key
            ? { ...e, qty: Math.min(99, (e.qty || 1) + quantity) }
            : e
        );
      }
      return [...prev, { id: item.id, size: size || null, qty: quantity }];
    });
  }, []);

  const setQuantity = useCallback((id, size, quantity) => {
    const key = variantKey(id, size);
    setEntries((prev) => {
      if (!quantity || quantity < 1) return prev.filter((e) => variantKey(e.id, e.size) !== key);
      return prev.map((e) =>
        variantKey(e.id, e.size) === key ? { ...e, qty: Math.min(99, quantity) } : e
      );
    });
  }, []);

  const removeItem = useCallback((id, size) => {
    const key = variantKey(id, size);
    setEntries((prev) => prev.filter((e) => variantKey(e.id, e.size) !== key));
  }, []);

  const clearCart = useCallback(() => setEntries([]), []);

  /** Open the drawer; re-check offer status at this exact moment. */
  const openCart = useCallback(() => {
    refreshOffer();
    setCartOpen(true);
  }, [refreshOffer]);

  const closeCart = useCallback(() => setCartOpen(false), []);

  const value = useMemo(
    () => ({
      lines,
      summary,
      offerStatus,
      refreshOffer,
      itemCount: summary.itemCount,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      isCartOpen,
      openCart,
      closeCart,
    }),
    [lines, summary, offerStatus, refreshOffer, addItem, setQuantity, removeItem, clearCart, isCartOpen, openCart, closeCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
