import { useCallback, useEffect, useRef, useState } from "react";
import { offerConfig } from "../data/offer.js";
import { getOfferStatus } from "../utils/offerStatus.js";

/**
 * Live offer status.
 * - Re-evaluates on page load (real device clock, explicit +05:00 offsets).
 * - Schedules an exact transition at the expiry timestamp so the offer
 *   flips off automatically while a customer is browsing.
 * - Periodic safety re-check every 30 seconds (e.g. after sleep/wake).
 * - `refresh()` can be called any time (cart open, checkout, WhatsApp send).
 */
export function useOfferStatus() {
  const [status, setStatus] = useState(() => getOfferStatus(offerConfig, new Date()));
  const timerRef = useRef(null);

  const evaluate = useCallback(() => {
    const next = getOfferStatus(offerConfig, new Date());
    setStatus(next);
    return next;
  }, []);

  useEffect(() => {
    const scheduleExpiry = () => {
      const next = getOfferStatus(offerConfig, new Date());
      setStatus(next);
      if (next.active && next.secondsRemaining > 0) {
        // Flip exactly at (or a hair after) the expiry timestamp.
        const delay = Math.min(next.secondsRemaining * 1000 + 60, 2147483000);
        timerRef.current = setTimeout(scheduleExpiry, delay);
      }
    };

    scheduleExpiry();
    const interval = setInterval(() => {
      setStatus(getOfferStatus(offerConfig, new Date()));
    }, 30000);

    const onFocus = () => setStatus(getOfferStatus(offerConfig, new Date()));
    window.addEventListener("focus", onFocus);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return { offerStatus: status, refreshOffer: evaluate };
}
