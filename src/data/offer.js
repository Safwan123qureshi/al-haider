/**
 * ---------------------------------------------------------------
 * LIMITED-TIME OFFER CONFIGURATION — Al Haider Pizza House
 * ---------------------------------------------------------------
 * ⚠️ THE 20% OFFER HAS ENDED (October 2026) AND IS DISABLED.
 *    `enabled: false` below is a complete kill-switch: the banner,
 *    badges, crossed-out prices, cart/checkout discounts and
 *    WhatsApp discounted totals are ALL switched off. Regular menu
 *    prices are shown and charged everywhere.
 *    Do NOT re-enable this without a new, approved offer.
 *
 * Edit this file to control the promotional discount.
 *
 * enabled          : set to false to turn the offer off immediately
 * discountPercent  : e.g. 20 for "20% OFF"
 * startDate        : null = offer starts immediately (enabled = true)
 *                    or an ISO string with explicit timezone offset,
 *                    e.g. "2026-10-01T00:00:00+05:00"
 * endDate          : ISO string WITH explicit +05:00 (Pakistan, Asia/Karachi)
 *                    The offer is active strictly BEFORE this timestamp.
 *                    At exactly 2026-10-31T23:59:00+05:00 it is INACTIVE.
 * applyToAllItems  : true  -> every discount-eligible menu item gets the discount
 *                    false -> only items with discountEligible: true get it
 *
 * IMPORTANT: always include the explicit "+05:00" timezone offset in dates
 * so the offer expires at the correct moment in Pakistan regardless of
 * the visitor's device timezone.
 * ---------------------------------------------------------------
 */
export const offerConfig = {
  enabled: false, // 20% offer ENDED (expired 2026-10-31 23:59 PKT) — keep false
  discountPercent: 20,
  startDate: null,
  endDate: "2026-10-31T23:59:00+05:00",
  title: "Limited-Time Offer",
  description: "Get 20% OFF at Al Haider Pizza House!",
  applyToAllItems: true,
};
