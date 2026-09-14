import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingsByGenre, loadTaxonomy } from "@/lib/data";
import { LANGS, SITE_NAME, UI, type Lang } from "@/lib/i18n";
import { absolute, urlGenre } from "@/lib/url";
import { ListingRow } from "@/app/_components/ListingRow";
import { FilterBar } from "@/app/_components/FilterBar";

type Props = { params: { lang: string; genre: string } };

export function generateStaticParams() {
  const taxonomy = loadTaxonomy();
  const params: { lang: string; genre: string }[] = [];
  for (const lang of LANGS) {
    for (const g of taxonomy.genres) {
      params.push({ lang, genre: g.slug });
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
      ? `宮崎の${genre.ja}一覧 | ${SITE_NAME.ja}`
      : `${genre.en} in Miyazaki | ${SITE_NAME.en}`;
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
  if (!genre) notFound();

  const listings = listingsByGenre(params.genre).sort((a, b) =>
    a.name.ja.localeCompare(b.name.ja, "ja"),
  );

  const catLabels: Record<string, { ja: string; en: string }> = {};
  for (const c of taxonomy.categories[params.genre] ?? []) catLabels[c.slug] = c;
  const areaLabels: Record<string, { ja: string; en: string }> = {};
  for (const a of taxonomy.areas) areaLabels[a.slug] = a;

  const usedCategories = new Set<string>();
  const usedAreas = new Set<string>();
  for (const l of listings) {
    for (const c of l.category) usedCategories.add(c);
    usedAreas.add(l.area);
  }

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
