import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingsByGenre, loadTaxonomy } from "@/lib/data";
import { LANGS, SITE_NAME, UI, type Lang } from "@/lib/i18n";
import { absolute, urlCategory } from "@/lib/url";
import { ListingRow } from "@/app/_components/ListingRow";
import { FilterBar } from "@/app/_components/FilterBar";

type Props = { params: { lang: string; genre: string; category: string } };

export function generateStaticParams() {
  const taxonomy = loadTaxonomy();
  const params: { lang: string; genre: string; category: string }[] = [];
  for (const lang of LANGS) {
    for (const g of taxonomy.genres) {
      for (const c of taxonomy.categories[g.slug] ?? []) {
        params.push({ lang, genre: g.slug, category: c.slug });
      }
    }
  }
  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const cat = taxonomy.categories[params.genre]?.find((c) => c.slug === params.category);
  if (!genre || !cat) return {};
  const title =
    lang === "ja"
      ? `宮崎の${cat.ja}（${genre.ja}）一覧 | ${SITE_NAME.ja}`
      : `${cat.en} (${genre.en}) in Miyazaki | ${SITE_NAME.en}`;
  const description =
    lang === "ja"
      ? `宮崎県内の${cat.ja}を出典URL付きで一覧にしています。`
      : `A source-linked directory of ${cat.en.toLowerCase()} across Miyazaki.`;
  return {
    title,
    description,
    alternates: {
      canonical: absolute(urlCategory(lang, params.genre, params.category)),
      languages: {
        ja: absolute(urlCategory("ja", params.genre, params.category)),
        en: absolute(urlCategory("en", params.genre, params.category)),
      },
    },
  };
}

export default function CategoryPage({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const cat = taxonomy.categories[params.genre]?.find((c) => c.slug === params.category);
  if (!genre || !cat) notFound();

  const all = listingsByGenre(params.genre);
  const listings = all
    .filter((l) => l.category.includes(params.category))
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
            ? `宮崎の${cat.ja}（${genre.ja}）`
            : `${cat.en} (${genre.en}) in Miyazaki`}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {listings.length} {UI.spot_count[lang]}
        </p>
      </div>
      <FilterBar
        lang={lang}
        genre={params.genre}
        taxonomy={taxonomy}
        activeCategory={params.category}
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
