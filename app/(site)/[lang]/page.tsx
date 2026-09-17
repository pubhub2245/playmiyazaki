import type { Metadata } from "next";
import Link from "next/link";
import { loadAllListings, loadTaxonomy } from "@/lib/data";
import { HOME_TITLE, SITE_TAGLINE, type Lang } from "@/lib/i18n";
import { absolute, urlFeature, urlGenre, urlHome } from "@/lib/url";
import { allFeaturePagesRanked, genresWithListings } from "@/lib/coverage";
import { GenreIcon } from "@/app/_components/GenreIcon";
import { FilterableList } from "@/app/_components/FilterableList";
import { RevealList } from "@/app/_components/RevealList";
import { Row } from "@/app/_components/Row";
import { listingToRow } from "@/lib/rows";

type Props = { params: { lang: string } };

const HERO = {
  ja: {
    heading: "宮崎で遊ぶ場所を、全部。",
    leadPrefix: "サーフィン・キャンプ・食・ゴルフ。出典つきで ",
    leadSuffix: " か所。",
    recentHeading: "最近確認したスポット",
    intentHeading: "条件から探す",
  },
  en: {
    heading: "Every place to play in Miyazaki.",
    leadPrefix: "Surf, camp, food and golf. ",
    leadSuffix: " places, every one with a source.",
    recentHeading: "Recently verified",
    intentHeading: "Browse by feature",
  },
};

const COUNT_LABEL = {
  ja: "スポット",
  en: "places",
};

export function generateMetadata({ params }: Props): Metadata {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const url = absolute(urlHome(lang));
  return {
    title: { absolute: HOME_TITLE[lang] },
    description: SITE_TAGLINE[lang],
    alternates: {
      canonical: url,
      languages: {
        ja: absolute(urlHome("ja")),
        en: absolute(urlHome("en")),
      },
    },
  };
}

export default function HomePage({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const listings = loadAllListings();
  const counts = new Map<string, number>();
  for (const l of listings) counts.set(l.genre, (counts.get(l.genre) ?? 0) + 1);

  const active = new Set(genresWithListings());
  const genres = taxonomy.genres.filter((g) => active.has(g.slug));
  const total = listings.length;

  const recent = [...listings]
    .sort((a, b) => (b.verified_at + b.slug).localeCompare(a.verified_at + a.slug))
    .slice(0, 6)
    .map((l) => listingToRow(l, taxonomy, lang));

  const topFeaturePages = allFeaturePagesRanked().slice(0, 12);
  const genreLabelMap = new Map(taxonomy.genres.map((g) => [g.slug, g]));

  const t = HERO[lang];

  return (
    <div className="space-y-8">
      {lang === "en" && (
        <p className="pm-mono text-[12px] uppercase tracking-wider text-text-secondary">
          Zero-crowd Japan. Surf, camp, food and golf in Miyazaki — with prices, verified.
        </p>
      )}
      <section className="space-y-3">
        <h1 className="font-display font-bold text-[32px] leading-tight text-text-primary">
          {t.heading}
        </h1>
        <p className="pm-prose">
          <span>{t.leadPrefix}</span>
          <span className="pm-mono">{total}</span>
          <span>{t.leadSuffix}</span>
        </p>
      </section>

      <section>
        <FilterableList
          items={listings.map((l) => listingToRow(l, taxonomy, lang))}
          lang={lang}
          hideWhenEmpty
        />
      </section>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {genres.map((g) => (
            <Link
              key={g.slug}
              href={urlGenre(lang, g.slug)}
              className="pm-touch flex items-center gap-4 border border-line rounded-lg p-4 no-underline text-text-primary hover:bg-panel transition-colors"
            >
              <span className="text-text-primary">
                <GenreIcon genre={g.slug} />
              </span>
              <span className="flex-1 font-display font-bold text-[18px]">{g[lang]}</span>
              <span className="pm-mono text-[13px] text-text-secondary">
                {counts.get(g.slug) ?? 0} {COUNT_LABEL[lang]}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {topFeaturePages.length > 0 && (
        <section className="space-y-3">
          <h2 className="pm-mono text-[12px] uppercase tracking-wider text-text-secondary">
            {t.intentHeading}
          </h2>
          <div className="flex flex-wrap gap-2">
            {topFeaturePages.map(({ genre, feature, count }) => {
              const g = genreLabelMap.get(genre);
              const featureEntry = (taxonomy.features[genre] ?? []).find((f) => f.slug === feature);
              if (!g || !featureEntry) return null;
              return (
                <Link
                  key={`${genre}-${feature}`}
                  href={urlFeature(lang, genre, feature)}
                  className="pm-chip"
                >
                  <span>
                    {g[lang]}
                    {lang === "ja" ? "：" : ": "}
                    {featureEntry[lang]}
                  </span>
                  <span className="pm-chip-count">{count}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="pm-mono text-[12px] uppercase tracking-wider text-text-secondary">
            {t.recentHeading}
          </h2>
          <RevealList>
            {recent.map((r) => (
              <Row key={r.slug} data={r} lang={lang} variant="small" />
            ))}
          </RevealList>
        </section>
      )}
    </div>
  );
}
