const STRIPE_COUNT = 13;
const STRIPE_H = 20 / STRIPE_COUNT;

export function FlagIcon({ country, size = 20 }: { country: "vn" | "us"; size?: number }) {
  const width = size;
  const height = Math.round((size * 2) / 3);

  if (country === "vn") {
    return (
      <svg width={width} height={height} viewBox="0 0 30 20" className="rounded-[2px] shrink-0" aria-hidden>
        <rect width="30" height="20" fill="#DA251D" />
        <text x="15" y="14.5" textAnchor="middle" fontSize="11" fill="#FFFF00">★</text>
      </svg>
    );
  }

  return (
    <svg width={width} height={height} viewBox="0 0 30 20" className="rounded-[2px] shrink-0" aria-hidden>
      <rect width="30" height="20" fill="#B22234" />
      {Array.from({ length: STRIPE_COUNT }).map((_, i) =>
        i % 2 === 1 ? <rect key={i} y={i * STRIPE_H} width="30" height={STRIPE_H} fill="#FFFFFF" /> : null,
      )}
      <rect width="12" height={STRIPE_H * 7} fill="#3C3B6E" />
    </svg>
  );
}
