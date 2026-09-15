const common = {
  width: 32,
  height: 32,
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function GenreIcon({ genre, className }: { genre: string; className?: string }) {
  switch (genre) {
    case "surf":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" {...common} className={className} aria-hidden>
          <path d="M2 12 C 8 6, 14 18, 20 12 S 28 6, 30 10" />
          <path d="M2 20 C 8 14, 14 26, 20 20 S 28 14, 30 18" />
        </svg>
      );
    case "camp":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" {...common} className={className} aria-hidden>
          <path d="M4 26 L 16 6 L 28 26 Z" />
          <path d="M16 6 L 16 26" />
        </svg>
      );
    case "food":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" {...common} className={className} aria-hidden>
          <path d="M16 4 C 18 10, 24 12, 24 20 C 24 25, 20 28, 16 28 C 12 28, 8 25, 8 20 C 8 14, 14 12, 16 4 Z" />
        </svg>
      );
    case "golf":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" {...common} className={className} aria-hidden>
          <path d="M10 28 L 10 4" />
          <path d="M10 4 L 22 8 L 10 12" />
        </svg>
      );
    default:
      return null;
  }
}
