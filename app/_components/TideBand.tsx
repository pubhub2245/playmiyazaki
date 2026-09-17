import { CountUp } from "./CountUp";
import type { Lang } from "@/lib/i18n";

const COUNT_LABEL: Record<Lang, string> = {
  ja: "スポット",
  en: "places",
  ko: "스팟",
};

export function TideBand({
  title,
  count,
  lang,
}: {
  title: string;
  count: number;
  lang: Lang;
}) {
  return (
    <div className="pm-band">
      <div className="pm-band-title">{title}</div>
      <div className="pm-band-count">
        <CountUp target={count} /> {COUNT_LABEL[lang]}
      </div>
      <svg
        className="pm-band-wave"
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 12 C 15 4, 30 20, 50 12 S 85 4, 100 12 L 100 20 L 0 20 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
