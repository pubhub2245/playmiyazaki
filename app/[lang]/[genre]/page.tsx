import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingsByGenre, loadTaxonomy } from "@/lib/data";
import { LANGS, UI, type Lang } from "@/lib/i18n";
import { absolute, urlGenre } from "@/lib/url";
import { ListingRow } from "@/app/_components/ListingRow";
import { FilterBar } from "@/app/_components/FilterBar";
import {
  areasWithListings,
  categoriesWithListings,
  genresWithListings,
  hasGenre,
} from "@/lib/coverage";

type Props = { params: { lang: string; genre: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  const params: { lang: string; genre: string }[] = [];
  for (const lang of LANGS) {
    for (const g of genresWithListings()) {
      params.push({ lang, genre: g });
    }
  }
  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  if (!genre) return {};
  const title =
    lang === "ja"
      ? `宮崎の${genre.ja}一覧`
      : `${genre.en} in Miyazaki`;
  const description =
    lang === "ja"
      ? `宮崎県内の${genre.ja}を、出典URL付きで一覧にしています。`
      : `A source-linked directory of ${genre.en.toLowerCase()} spots across Miyazaki.`;
  return {
    title,
    description,
    alternates: {
      canonical: absolute(urlGenre(lang, params.genre)),
      languages: {
        ja: absolute(urlGenre("ja", params.genre)),
        en: absolute(urlGenre("en", params.genre)),
      },
    },
  };
}

export default function GenrePage({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  if (!genre || !hasGenre(params.genre)) notFound();

  const listings = listingsByGenre(params.genre);
  const catLabels: Record<string, { ja: string; en: string }> = {};
  for (const c of taxonomy.categories[params.genre] ?? []) catLabels[c.slug] = c;
  const areaLabels: Record<string, { ja: string; en: string }> = {};
  for (const a of taxonomy.areas) areaLabels[a.slug] = a;

  const availableCategories = new Set(categoriesWithListings(params.genre));
  const availableAreas = new Set(areasWithListings(params.genre));

  const categoryOrder = taxonomy.categories[params.genre] ?? [];
  const groups = categoryOrder
    .filter((c) => availableCategories.has(c.slug))
    .map((c) => ({
      category: c,
      items: listings
        .filter((l) => l.category.includes(c.slug))
        .sort((a, b) => {
          const aArea = areaLabels[a.area]?.ja ?? a.area;
          const bArea = areaLabels[b.area]?.ja ?? b.area;
          const areaCmp = aArea.localeCompare(bArea, "ja");
          if (areaCmp !== 0) return areaCmp;
          return a.name.ja.localeCompare(b.name.ja, "ja");
        }),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {lang === "ja" ? `宮崎の${genre.ja}` : `${genre.en} in Miyazaki`}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {listings.length} {UI.spot_count[lang]}
        </p>
      </div>
      <FilterBar
        lang={lang}
        genre={params.genre}
        taxonomy={taxonomy}
        availableCategories={availableCategories}
        availableAreas={availableAreas}
      />
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.category.slug} className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-800">
              {group.category[lang]}
              <span className="ml-2 text-xs font-normal text-slate-500">
                {group.items.length} {UI.spot_count[lang]}
              </span>
            </h2>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded">
              {group.items.map((l) => (
                <ListingRow
                  key={l.slug}
                  listing={l}
                  lang={lang}
                  categoryLabels={catLabels}
                  areaLabels={areaLabels}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
