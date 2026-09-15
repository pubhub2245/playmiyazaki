import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingsByGenre, loadTaxonomy } from "@/lib/data";
import { LANGS, type Lang } from "@/lib/i18n";
import { absolute, urlArea, urlGenre, urlHome } from "@/lib/url";
import {
  areasWithListings,
  genresWithListings,
  hasArea,
} from "@/lib/coverage";
import { CategoryChips, categoryCountsForGenre } from "@/app/_components/FilterBar";
import { Breadcrumbs } from "@/app/_components/Breadcrumbs";
import { FilterableList } from "@/app/_components/FilterableList";
import { listingToRow } from "@/lib/rows";

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
    lang === "ja" ? `${area.ja}の${genre.ja}一覧` : `${genre.en} in ${area.en}`;
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

  const filtered = listingsByGenre(params.genre)
    .filter((l) => l.area === params.area)
    .sort((a, b) => a.name.ja.localeCompare(b.name.ja, "ja"));

  const catCounts = categoryCountsForGenre(filtered);
  const items = filtered.map((l) => listingToRow(l, taxonomy, lang));

  return (
    <div className="space-y-6">
      <Breadcrumbs
        lang={lang}
        crumbs={[
          { label: "Play Miyazaki", href: urlHome(lang) },
          { label: lang === "ja" ? genre.ja : genre.en, href: urlGenre(lang, params.genre) },
          { label: lang === "ja" ? area.ja : area.en },
        ]}
      />
      <div>
        <h1 className="font-display font-bold text-[28px] leading-tight text-text-primary">
          {lang === "ja" ? `${area.ja}の${genre.ja}` : `${genre.en} in ${area.en}`}
        </h1>
        <p className="pm-mono text-[12px] text-text-secondary mt-1">
          {filtered.length} {lang === "ja" ? "スポット" : "places"}
        </p>
      </div>

      <CategoryChips
        lang={lang}
        genre={params.genre}
        taxonomy={taxonomy}
        categoryCounts={catCounts}
      />

      <FilterableList items={items} lang={lang} />
    </div>
  );
}
