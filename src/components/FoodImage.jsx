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
 * Food image with WebP-first progressive loading and graceful fallback.
 *
 * Tries the WebP version first (smaller, faster), falls back to JPG.
 * - `loading="eager"` for above-the-fold / hero images
 * - `loading="lazy"` for below-the-fold images
 * - `decoding="async"` to avoid blocking paint
 * - width/height attributes prevent layout shift
 */
export default function FoodImage({
  src,
  alt = "",
  category = "",
  className = "",
  loading = "lazy",
  width,
  height,
  priority = false,
}) {
  const [failed, setFailed] = useState(false);
  const emoji = CATEGORY_FALLBACK[category] || "🍽️";

  // Derive WebP path by replacing extension
  const webpSrc = src ? src.replace(/\.(jpg|jpeg)$/i, ".webp") : null;

  if (!src || failed) {
    return (
      <div className={`food-fallback ${className}`} role="img" aria-label={alt || "Food image"}>
        <span aria-hidden="true">{emoji}</span>
      </div>
    );
  }

  return (
    <picture>
      {webpSrc && (
        <source
          srcSet={webpSrc}
          type="image/webp"
          loading={loading}
          decoding="async"
        />
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        width={width}
        height={height}
        fetchpriority={priority ? "high" : undefined}
        className={className}
        onError={() => setFailed(true)}
      />
    </picture>
  );
}
