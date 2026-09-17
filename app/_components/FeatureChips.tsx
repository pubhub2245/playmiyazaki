import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { urlFeature } from "@/lib/url";
import type { Listing, Taxonomy } from "@/lib/types";
import { FEATURE_MIN_COUNT } from "@/lib/coverage";

const LABEL = {
  ja: "特徴で絞る",
  en: "Filter by feature",
  ko: "특징으로 필터",
};

export function FeatureChips({
  lang,
  genre,
  taxonomy,
  activeFeature,
  featureCounts,
}: {
  lang: Lang;
  genre: string;
  taxonomy: Taxonomy;
  activeFeature?: string | null;
  featureCounts: Map<string, number>;
}) {
  const entries = (taxonomy.features[genre] ?? []).filter(
    (f) => (featureCounts.get(f.slug) ?? 0) >= FEATURE_MIN_COUNT,
  );
  if (entries.length === 0) return null;
  return (
    <div>
      <div className="pm-mono text-[11px] text-text-secondary mb-2 uppercase tracking-wider">
        {LABEL[lang]}
      </div>
      <div className="flex flex-wrap gap-2">
        {entries.map((f) => (
          <Link
            key={f.slug}
            href={urlFeature(lang, genre, f.slug)}
            className={"pm-chip " + (activeFeature === f.slug ? "is-active" : "")}
          >
            <span>{f[lang]}</span>
            <span className="pm-chip-count">{featureCounts.get(f.slug) ?? 0}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function featureCountsForGenre(listings: Listing[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of listings) {
    for (const f of l.features) m.set(f, (m.get(f) ?? 0) + 1);
  }
  return m;
}
