import { useState } from "react";

const CATEGORY_FALLBACK = {
  pizza: "🍕",
  burger: "🍔",
  wrap: "🌯",
  broast: "🍗",
  wings: "🔥",
  fries: "🍟",
  pasta: "🍝",
  sandwich: "🥪",
  soup: "🍲",
  drink: "🥤",
};

/**
 * Food image with graceful fallback.
 * If the image path is missing or fails to load (offline, renamed file…),
 * a branded gradient placeholder with the category emoji is shown instead.
 */
export default function FoodImage({ src, alt = "", category = "", className = "" }) {
  const [failed, setFailed] = useState(false);
  const emoji = CATEGORY_FALLBACK[category] || "🍽️";

  if (!src || failed) {
    return (
      <div className={`food-fallback ${className}`} role="img" aria-label={alt || "Food image"}>
        <span aria-hidden="true">{emoji}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
