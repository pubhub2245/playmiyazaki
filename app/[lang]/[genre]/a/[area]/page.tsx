import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingsByGenre, loadTaxonomy } from "@/lib/data";
import { LANGS, UI, type Lang } from "@/lib/i18n";
import { absolute, urlArea } from "@/lib/url";
import { ListingRow } from "@/app/_components/ListingRow";
import { FilterBar } from "@/app/_components/FilterBar";
import {
  areasWithListings,
  categoriesWithListings,
  genresWithListings,
  hasArea,
} from "@/lib/coverage";

type Props = { params: { lang: string; genre: string; area: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  const params: { lang: string; genre: string; area: string }[] = [];
  for (const lang of LANGS) {
    for (const g of genresWithListings()) {
      for (const a of areasWithListings(g)) {
        params.push({ lang, genre: g, area: a });
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
      ? `${area.ja}の${genre.ja}一覧`
      : `${genre.en} in ${area.en}`;
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
  if (!genre || !area || !hasArea(params.genre, params.area)) notFound();

  const catLabels: Record<string, { ja: string; en: string }> = {};
  for (const c of taxonomy.categories[params.genre] ?? []) catLabels[c.slug] = c;
  const areaLabels: Record<string, { ja: string; en: string }> = {};
  for (const a of taxonomy.areas) areaLabels[a.slug] = a;

  const listings = listingsByGenre(params.genre)
    .filter((l) => l.area === params.area)
    .sort((a, b) => a.name.ja.localeCompare(b.name.ja, "ja"));

  const availableCategories = new Set(categoriesWithListings(params.genre));
  const availableAreas = new Set(areasWithListings(params.genre));

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
        availableCategories={availableCategories}
        availableAreas={availableAreas}
      />
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
    </div>
  );
}
