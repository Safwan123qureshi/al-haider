import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { offerConfig } from "../data/offer.js";

function splitRemaining(seconds) {
  const s = Math.max(0, seconds);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

const pad = (n) => String(n).padStart(2, "0");

/**
 * Promotional banner — visible ONLY while the offer is active.
 * Automatically hides itself at the exact expiry moment.
 */
export default function OfferBanner() {
  const { offerStatus } = useCart();
  const [now, setNow] = useState(() => offerStatus.secondsRemaining);

  useEffect(() => {
    setNow(offerStatus.secondsRemaining);
    if (!offerStatus.active) return undefined;
    const id = setInterval(() => {
      setNow((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [offerStatus.active, offerStatus.secondsRemaining]);

  if (!offerStatus.active) return null;

  const { days, hours, minutes, seconds } = splitRemaining(now);

  return (
    <section className="offer-banner" aria-label="Limited-time offer">
      <div className="offer-banner__stripe" aria-hidden="true" />
      <div className="container offer-banner__inner">
        <div className="offer-banner__text">
          <span className="offer-banner__flash" aria-hidden="true">🔥</span>
          <div>
            <p className="offer-banner__title">
              LIMITED-TIME OFFER — GET {offerConfig.discountPercent}% OFF!
            </p>
            <p className="offer-banner__desc">
              {offerConfig.description} Applied automatically at checkout on the full menu.
            </p>
          </div>
        </div>

        <div className="offer-banner__countdown" aria-label={`Offer ends in ${days} days ${hours} hours`}>
          <div className="count-box"><strong>{days}</strong><span>DAYS</span></div>
          <div className="count-sep" aria-hidden="true">:</div>
          <div className="count-box"><strong>{pad(hours)}</strong><span>HRS</span></div>
          <div className="count-sep" aria-hidden="true">:</div>
          <div className="count-box"><strong>{pad(minutes)}</strong><span>MIN</span></div>
          <div className="count-sep" aria-hidden="true">:</div>
          <div className="count-box"><strong>{pad(seconds)}</strong><span>SEC</span></div>
        </div>

        <a href="#menu" className="btn btn--dark btn--lg offer-banner__cta">
          Order Now &amp; Save
        </a>
      </div>
    </section>
  );
}
