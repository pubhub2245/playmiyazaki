import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAllListings, loadTaxonomy } from "@/lib/data";
import { LANGS, type Lang } from "@/lib/i18n";
import { absolute, urlArea, urlAreaIndex, urlHome } from "@/lib/url";
import { areaTotalCount, areasWithIndexPage, genresInArea, hasAreaIndex } from "@/lib/coverage";
import { GenreIcon } from "@/app/_components/GenreIcon";
import { Breadcrumbs } from "@/app/_components/Breadcrumbs";
import { FilteredCategoryGroups, type Group } from "@/app/_components/FilteredCategoryGroups";
import { listingToRow } from "@/lib/rows";

type Props = { params: { lang: string; area: string } };

export const dynamicParams = false;

const COUNT_LABEL = { ja: "スポット", en: "places" };

export function generateStaticParams() {
  const params: { lang: string; area: string }[] = [];
  for (const lang of LANGS) {
    for (const a of areasWithIndexPage()) {
      params.push({ lang, area: a });
    }
  }
  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const area = taxonomy.areas.find((a) => a.slug === params.area);
  if (!area) return {};
  const total = areaTotalCount(params.area);
  const title = lang === "ja" ? `${area.ja}で遊ぶ` : `Things to do in ${area.en}`;
  const description =
    lang === "ja"
      ? `${area.ja}のサーフィン・キャンプ・食・ゴルフを、出典URL付きで${total}か所まとめています。`
      : `${total} places to surf, camp, eat and play golf in ${area.en}, every one with a source.`;
  return {
    title,
    description,
    alternates: {
      canonical: absolute(urlAreaIndex(lang, params.area)),
      languages: {
        ja: absolute(urlAreaIndex("ja", params.area)),
        en: absolute(urlAreaIndex("en", params.area)),
      },
    },
  };
}

export default function AreaIndexPage({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const area = taxonomy.areas.find((a) => a.slug === params.area);
  if (!area || !hasAreaIndex(params.area)) notFound();

  const genreLabelMap = new Map(taxonomy.genres.map((g) => [g.slug, g]));
  const byGenre = genresInArea(params.area);
  const listings = loadAllListings().filter((l) => l.area === params.area);

  const groups: Group[] = byGenre.map(({ genre }) => {
    const g = genreLabelMap.get(genre);
    const items = listings
      .filter((l) => l.genre === genre)
      .sort((a, b) => a.name.ja.localeCompare(b.name.ja, "ja"))
      .map((l) => listingToRow(l, taxonomy, lang));
    return { key: genre, label: g ? g[lang] : genre, items };
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs
        lang={lang}
        crumbs={[
          { label: "Play Miyazaki", href: urlHome(lang) },
          { label: lang === "ja" ? area.ja : area.en },
        ]}
      />

      <div>
        <h1 className="font-display font-bold text-[28px] leading-tight text-text-primary">
          {lang === "ja" ? `${area.ja}で遊ぶ` : `Things to do in ${area.en}`}
        </h1>
        <p className="pm-mono text-[12px] text-text-secondary mt-1">
          {listings.length} {COUNT_LABEL[lang]}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {byGenre.map(({ genre, count }) => {
          const g = genreLabelMap.get(genre);
          if (!g) return null;
          return (
            <Link
              key={genre}
              href={urlArea(lang, genre, params.area)}
              className="pm-touch flex items-center gap-4 border border-line rounded-lg p-4 no-underline text-text-primary hover:bg-panel transition-colors"
            >
              <span className="text-text-primary">
                <GenreIcon genre={genre} />
              </span>
              <span className="flex-1 font-display font-bold text-[18px]">
                {lang === "ja" ? `${area.ja}の${g.ja}` : `${g.en} in ${area.en}`}
              </span>
              <span className="pm-mono text-[13px] text-text-secondary">
                {count} {COUNT_LABEL[lang]}
              </span>
            </Link>
          );
        })}
      </div>

      <FilteredCategoryGroups groups={groups} lang={lang} />
    </div>
  );
}
