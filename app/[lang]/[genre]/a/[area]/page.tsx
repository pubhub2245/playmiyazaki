import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingsByGenre, loadTaxonomy } from "@/lib/data";
import { LANGS, SITE_NAME, UI, type Lang } from "@/lib/i18n";
import { absolute, urlArea } from "@/lib/url";
import { ListingRow } from "@/app/_components/ListingRow";
import { FilterBar } from "@/app/_components/FilterBar";

type Props = { params: { lang: string; genre: string; area: string } };

export function generateStaticParams() {
  const taxonomy = loadTaxonomy();
  const params: { lang: string; genre: string; area: string }[] = [];
  for (const lang of LANGS) {
    for (const g of taxonomy.genres) {
      for (const a of taxonomy.areas) {
        params.push({ lang, genre: g.slug, area: a.slug });
      }
    }
  }
  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const area = taxonomy.areas.find((a) => a.slug === params.area);
  if (!genre || !area) return {};
  const title =
    lang === "ja"
      ? `${area.ja}の${genre.ja}一覧 | ${SITE_NAME.ja}`
      : `${genre.en} in ${area.en} | ${SITE_NAME.en}`;
  const description =
    lang === "ja"
      ? `${area.ja}の${genre.ja}を出典URL付きで一覧にしています。`
      : `A source-linked directory of ${genre.en.toLowerCase()} in ${area.en}.`;
  return {
    title,
    description,
    alternates: {
      canonical: absolute(urlArea(lang, params.genre, params.area)),
      languages: {
        ja: absolute(urlArea("ja", params.genre, params.area)),
        en: absolute(urlArea("en", params.genre, params.area)),
      },
    },
  };
}

export default function AreaPage({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const area = taxonomy.areas.find((a) => a.slug === params.area);
  if (!genre || !area) notFound();

  const all = listingsByGenre(params.genre);
  const listings = all
    .filter((l) => l.area === params.area)
    .sort((a, b) => a.name.ja.localeCompare(b.name.ja, "ja"));

  const catLabels: Record<string, { ja: string; en: string }> = {};
  for (const c of taxonomy.categories[params.genre] ?? []) catLabels[c.slug] = c;
  const areaLabels: Record<string, { ja: string; en: string }> = {};
  for (const a of taxonomy.areas) areaLabels[a.slug] = a;

  const usedCategories = new Set<string>();
  const usedAreas = new Set<string>();
  for (const l of all) {
    for (const c of l.category) usedCategories.add(c);
    usedAreas.add(l.area);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {lang === "ja"
            ? `${area.ja}の${genre.ja}`
            : `${genre.en} in ${area.en}`}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {listings.length} {UI.spot_count[lang]}
        </p>
      </div>
      <FilterBar
        lang={lang}
        genre={params.genre}
        taxonomy={taxonomy}
        activeArea={params.area}
        availableCategories={usedCategories}
        availableAreas={usedAreas}
      />
      {listings.length === 0 ? (
        <p className="text-sm text-slate-500">{UI.no_listings[lang]}</p>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 rounded">
          {listings.map((l) => (
            <ListingRow
              key={l.slug}
              listing={l}
              lang={lang}
              categoryLabels={catLabels}
              areaLabels={areaLabels}
            />
          ))}
        </div>
      )}
    </div>
  );
}
