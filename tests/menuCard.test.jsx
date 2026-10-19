import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import App from "../src/App.jsx";

/**
 * Regression tests for the reported bug:
 * "Clicking Add to Cart opens a blank new tab."
 *
 * Asserts that Add to Cart NEVER calls window.open / never navigates,
 * and that cart state, badge count, totals, quantity controls,
 * removal and the cart drawer all work.
 */

// Scoped to the navbar badge on purpose: the string "1" also legitimately
// appears elsewhere (e.g. the Soup category chip count of 1 item).
const navbarBadge = () => document.querySelector(".navbar__badge");

const addButtonFor = (name) =>
  screen.getAllByLabelText(`Add ${name} to cart`)[0];

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Add to Cart must not open a new tab", () => {
  it("clicking Add to Cart never calls window.open", () => {
    const openSpy = vi.spyOn(window, "open");
    render(<App />);

    fireEvent.click(addButtonFor("Zinger Burger"));
    fireEvent.click(addButtonFor("Zinger Burger"));
    fireEvent.click(addButtonFor("AH Special Pizza"));

    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("does not attempt page navigation (no location change)", () => {
    const before = window.location.href;
    render(<App />);
    fireEvent.click(addButtonFor("Zinger Burger"));
    expect(window.location.href).toBe(before);
  });

  it("the Add to Cart control is a <button>, never an <a>", () => {
    render(<App />);
    const btn = addButtonFor("Zinger Burger");
    expect(btn.tagName).toBe("BUTTON");
    expect(btn).not.toHaveAttribute("href");
    expect(btn).not.toHaveAttribute("target");
    expect(btn.getAttribute("type")).toBe("button");
  });
});

describe("Cart state behaviour", () => {
  it("adds item, updates navbar badge count and persists to localStorage", () => {
    render(<App />);
    expect(navbarBadge()).toBeNull();

    fireEvent.click(addButtonFor("Zinger Burger"));

    const badge = navbarBadge();
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe("1");

    const stored = JSON.parse(window.localStorage.getItem("alhaider_cart_v1"));
    expect(stored).toEqual([{ id: "zinger-burger", size: null, qty: 1 }]);
  });

  it("clicking the same product again increases its quantity (no duplicate rows)", () => {
    render(<App />);
    fireEvent.click(addButtonFor("Zinger Burger"));
    fireEvent.click(addButtonFor("Zinger Burger"));
    fireEvent.click(addButtonFor("Zinger Burger"));

    expect(document.querySelector(".navbar__badge").textContent).toBe("3");

    const stored = JSON.parse(window.localStorage.getItem("alhaider_cart_v1"));
    expect(stored).toHaveLength(1);
    expect(stored[0].qty).toBe(3);
  });

  it("different pizza sizes become distinct cart variants", () => {
    render(<App />);
    const pizza = addButtonFor("AH Special Pizza"); // defaults to Small (650)
    fireEvent.click(pizza);
    fireEvent.click(pizza);

    const stored = JSON.parse(window.localStorage.getItem("alhaider_cart_v1"));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual({ id: "ah-special-pizza", size: "small", qty: 2 });
  });

  it("cart survives a page reload (restored from localStorage)", () => {
    const { unmount } = render(<App />);
    fireEvent.click(addButtonFor("Tower Burger"));
    unmount();

    render(<App />);
    expect(document.querySelector(".navbar__badge").textContent).toBe("1");
  });
});

describe("Cart drawer", () => {
  const openDrawer = () => {
    fireEvent.click(screen.getByLabelText(/^Open cart/));
    return document.querySelector(".cart-drawer");
  };

  it("cart button opens the drawer showing name, quantity, prices and subtotal", () => {
    render(<App />);
    fireEvent.click(addButtonFor("Zinger Burger"));
    fireEvent.click(addButtonFor("Zinger Burger"));

    const drawer = openDrawer();
    expect(drawer).toHaveClass("is-open");
    expect(drawer.textContent).toContain("Zinger Burger");
    // qty control shows 2
    expect(within(drawer).getByText("2")).toBeTruthy();
    expect(drawer.textContent).toContain("Rs.");
    expect(drawer.textContent).toContain("Total Payable");

    // The 20% offer has ENDED (disabled in src/data/offer.js): the drawer must
    // show regular prices only — no discount row and no crossed-out prices.
    expect(drawer.textContent).not.toContain("Discount");
    expect(drawer.querySelector("s")).toBeNull();
  });

  it("no offer UI is rendered anywhere while the offer is disabled", () => {
    render(<App />);
    // No offer banner, no hero offer chip, no '20% OFF' badges on menu cards.
    expect(document.querySelector(".offer-banner")).toBeNull();
    expect(document.querySelector(".hero__offer-chip")).toBeNull();
    const badges = [...document.querySelectorAll(".menu-card__badge")];
    expect(badges.filter((b) => b.textContent.includes("OFF"))).toHaveLength(0);
  });

  it("quantity +/− controls update totals; remove clears the line", () => {
    render(<App />);
    fireEvent.click(addButtonFor("Zinger Burger"));
    openDrawer();

    const drawer = document.querySelector(".cart-drawer");
    fireEvent.click(within(drawer).getByLabelText("Increase quantity"));
    expect(within(drawer).getByText("2")).toBeTruthy();
    expect(document.querySelector(".navbar__badge").textContent).toBe("2");

    fireEvent.click(within(drawer).getByLabelText("Decrease quantity"));
    expect(within(drawer).getByText("1")).toBeTruthy();

    fireEvent.click(within(drawer).getByLabelText("Remove Zinger Burger"));
    expect(drawer.textContent).toContain("Your cart is empty");
    expect(document.querySelector(".navbar__badge")).toBeNull();
    expect(JSON.parse(window.localStorage.getItem("alhaider_cart_v1"))).toHaveLength(0);
  });

  it("Continue Shopping closes the drawer without losing the cart", () => {
    render(<App />);
    fireEvent.click(addButtonFor("Loaded Fries"));
    openDrawer();

    const drawer = document.querySelector(".cart-drawer");
    fireEvent.click(within(drawer).getByText("Continue Shopping"));
    expect(drawer).not.toHaveClass("is-open");
    expect(document.querySelector(".navbar__badge").textContent).toBe("1");
    expect(JSON.parse(window.localStorage.getItem("alhaider_cart_v1"))).toHaveLength(1);
  });
});
