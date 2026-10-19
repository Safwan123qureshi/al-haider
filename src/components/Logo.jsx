/**
 * Al Haider Pizza House — AH monogram logo.
 * Inline SVG (crisp at any size, no extra request, themeable via props).
 * A golden flame rises above the "AH" letters inside a black shield.
 */
export default function Logo({ size = 44, withText = true, textSide = "right", compact = false }) {
  const label = "Al Haider Pizza House";
  return (
    <span className={`logo logo--${textSide}`} style={{ "--logo-size": `${size}px` }}>
      <svg
        className="logo__mark"
        viewBox="0 0 64 64"
        width={size}
        height={size}
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id="ah-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffdd78" />
            <stop offset="0.55" stopColor="#f7b91e" />
            <stop offset="1" stopColor="#e09400" />
          </linearGradient>
          <linearGradient id="ah-flame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe9a3" />
            <stop offset="1" stopColor="#f2a200" />
          </linearGradient>
        </defs>

        {/* Shield */}
        <path
          d="M32 2.5 L58.5 11.5 V32.5 C58.5 48.6 47.6 57.9 32 61.5 C16.4 57.9 5.5 48.6 5.5 32.5 V11.5 Z"
          fill="#0c0c0f"
          stroke="url(#ah-gold)"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />

        {/* Flame */}
        <path
          d="M32 9.5 c1.4 3.6 3.3 5.2 5 7.6 c2.6 3.6 3.5 6.2 3.5 9 c0 4.4-3.5 7.8-8.5 7.8 s-8.5-3.4-8.5-7.8 c0-3.3 1.5-5.6 3.3-8.3 c.7 1.4 1.5 2.2 2.5 2.6 c-.6-4 .9-8 2.7-10.9 Z"
          fill="url(#ah-flame)"
        />
        <path
          d="M32 19.5 c.9 2 2 3 2.8 4.5 c1 1.9 1.4 3.2 1.4 4.7 c0 2.4-1.9 4.2-4.2 4.2 s-4.2-1.8-4.2-4.2 c0-1.8.8-3 1.9-4.6 c.4.8.9 1.2 1.5 1.4 c-.4-2.2.3-4 1-6 Z"
          fill="#fff6d8"
          opacity="0.9"
        />

        {/* AH monogram */}
        <text
          x="32"
          y="50.5"
          textAnchor="middle"
          fontFamily="'Poppins', 'Segoe UI', Arial, sans-serif"
          fontSize="16.5"
          fontWeight="800"
          fill="url(#ah-gold)"
          letterSpacing="0.5"
        >
          AH
        </text>
      </svg>

      {withText && (
        <span className="logo__text">
          <strong>AL HAIDER</strong>
          {!compact && <em>PIZZA HOUSE · MARDAN</em>}
        </span>
      )}
    </span>
  );
}
