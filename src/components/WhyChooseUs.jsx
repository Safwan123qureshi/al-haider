const ICONS = {
  menu: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 2v7c0 1.7 1.3 3 3 3s3-1.3 3-3V2M6 2v20M21 15V2a5 5 0 0 0-3 4.5V13h3M18 15v7" />
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22c4.4 0 8-3.6 8-8 0-3.5-2-6.2-4-8.5C14.4 7 13.6 8.6 12 10c-1.6-3.3-1-6.7-1-6.7C7.7 5.6 4 9.3 4 14c0 4.4 3.6 8 8 8z" />
      <path d="M12 22c2.2 0 4-1.8 4-4 0-1.8-1-3-2-4.2-.8 1.3-1.3 2.1-2 2.8-.8-1.6-.6-3.4-.6-3.4-1.7 1-3.4 2.8-3.4 4.8 0 2.2 1.8 4 4 4z" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.66 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.31 1.85.53 2.81.66A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  scooter: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="18.5" cy="17.5" r="2.5" />
      <path d="M8 17.5h8M14 5h3l2.5 9M14 5l-1.5 7H9" />
    </svg>
  ),
};

/**
 * "Why choose us" — factual highlights derived from the real menu
 * and how ordering actually works. No invented awards or ratings.
 */
export default function WhyChooseUs({ itemCount = 0, categoryCount = 0 }) {
  const cards = [
    {
      icon: ICONS.menu,
      title: "A Menu With Real Variety",
      text: `${itemCount}+ items across ${categoryCount} categories — pizza, burgers, broast, wraps, wings, fries, momos, pasta, sandwiches, soup and drinks.`,
    },
    {
      icon: ICONS.flame,
      title: "Fresh, Made To Order",
      text: "Your food is prepared when you order it — hot pizza, crispy broast and chilled drinks, just the way you like it.",
    },
    {
      icon: ICONS.phone,
      title: "Pizza Your Way",
      text: "Every pizza comes in Small, Medium and Large with live prices, so you always know exactly what you are paying.",
    },
    {
      icon: ICONS.scooter,
      title: "Delivery or Pickup",
      text: "Choose delivery to your door or pickup from Charsadda Chowk, and confirm your whole order in seconds on WhatsApp.",
    },
  ];

  return (
    <section className="section why-section">
      <div className="container">
        <div className="section-head">
          <p className="section-head__eyebrow">Why Choose Us</p>
          <h2 className="section-head__title">
            Built Around <span className="text-gold">Your Order</span>
          </h2>
        </div>

        <div className="why-grid">
          {cards.map((card) => (
            <article key={card.title} className="why-card">
              <div className="why-card__icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
