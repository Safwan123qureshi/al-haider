/**
 * ---------------------------------------------------------------
 * LIMITED-TIME OFFER CONFIGURATION — Al Haider Pizza House
 * ---------------------------------------------------------------
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
  enabled: true,
  discountPercent: 20,
  startDate: null,
  endDate: "2026-10-31T23:59:00+05:00",
  title: "Limited-Time Offer",
  description: "Get 20% OFF at Al Haider Pizza House!",
  applyToAllItems: true,
};
