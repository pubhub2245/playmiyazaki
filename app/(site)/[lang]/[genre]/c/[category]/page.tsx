import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingsByGenre, loadTaxonomy } from "@/lib/data";
import { LANGS, parseLang, type Lang } from "@/lib/i18n";
import { absolute, urlCategory, urlGenre, urlHome } from "@/lib/url";
import {
  areasWithListings,
  categoriesWithListings,
  genresWithListings,
  hasCategory,
} from "@/lib/coverage";
import { AreaChips, areaCountsForGenre } from "@/app/_components/FilterBar";
import { FeatureChips, featureCountsForGenre } from "@/app/_components/FeatureChips";
import { Breadcrumbs } from "@/app/_components/Breadcrumbs";
import { FilterableList } from "@/app/_components/FilterableList";
import { listingToRow } from "@/lib/rows";
import { JsonLd } from "@/app/_components/JsonLd";
import { collectionJsonLd } from "@/lib/jsonld";

type Props = { params: { lang: string; genre: string; category: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  const params: { lang: string; genre: string; category: string }[] = [];
  for (const lang of LANGS) {
    for (const g of genresWithListings()) {
      for (const c of categoriesWithListings(g)) {
        params.push({ lang, genre: g, category: c });
      }
    }
  }
  return params;
}

const SPOT_LABEL: Record<Lang, string> = {
  ja: "スポット",
  en: "places",
  ko: "스팟",
};

function catTitle(
  lang: Lang,
  genre: { ja: string; en: string; ko: string },
  cat: { ja: string; en: string; ko: string },
): string {
  if (lang === "ja") return `宮崎の${cat.ja}（${genre.ja}）一覧`;
  if (lang === "ko") return `미야자키의 ${cat.ko}(${genre.ko}) 목록`;
  return `${cat.en} (${genre.en}) in Miyazaki`;
}

function catDescription(
  lang: Lang,
  genre: { ja: string; en: string; ko: string },
  cat: { ja: string; en: string; ko: string },
): string {
  if (lang === "ja") return `宮崎県内の${cat.ja}を出典URL付きで一覧にしています。`;
  if (lang === "ko") return `미야자키현의 ${cat.ko}을(를) 출처 URL과 함께 정리한 목록입니다.`;
  return `A source-linked directory of ${cat.en.toLowerCase()} across Miyazaki.`;
}

function catHeading(
  lang: Lang,
  genre: { ja: string; en: string; ko: string },
  cat: { ja: string; en: string; ko: string },
): string {
  if (lang === "ja") return `宮崎の${cat.ja}（${genre.ja}）`;
  if (lang === "ko") return `미야자키의 ${cat.ko}(${genre.ko})`;
  return `${cat.en} (${genre.en}) in Miyazaki`;
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = parseLang(params.lang);
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const cat = taxonomy.categories[params.genre]?.find((c) => c.slug === params.category);
  if (!genre || !cat) return {};
  const languages: Record<string, string> = {};
  for (const l of LANGS) languages[l] = absolute(urlCategory(l, params.genre, params.category));
  return {
    title: catTitle(lang, genre, cat),
    description: catDescription(lang, genre, cat),
    alternates: {
      canonical: absolute(urlCategory(lang, params.genre, params.category)),
      languages,
    },
  };
}

export default function CategoryPage({ params }: Props) {
  const lang = parseLang(params.lang);
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const cat = taxonomy.categories[params.genre]?.find((c) => c.slug === params.category);
  if (!genre || !cat || !hasCategory(params.genre, params.category)) notFound();

  const listings = listingsByGenre(params.genre);
  const filtered = listings
    .filter((l) => l.category.includes(params.category))
    .sort((a, b) => {
      const aArea = taxonomy.areas.find((x) => x.slug === a.area)?.ja ?? a.area;
      const bArea = taxonomy.areas.find((x) => x.slug === b.area)?.ja ?? b.area;
      const areaCmp = aArea.localeCompare(bArea, "ja");
      if (areaCmp !== 0) return areaCmp;
      return a.name.ja.localeCompare(b.name.ja, "ja");
    });

  const areaCounts = areaCountsForGenre(filtered);
  const featCounts = featureCountsForGenre(filtered);
  void areasWithListings(params.genre);

  const items = filtered.map((l) => listingToRow(l, taxonomy, lang));
  const pageTitle =
    lang === "ja" ? `宮崎の${cat.ja}（${genre.ja}）` : `${cat.en} (${genre.en}) in Miyazaki`;
  const pageDescription =
    lang === "ja"
      ? `宮崎県内の${cat.ja}を出典URL付きで一覧にしています。`
      : `A source-linked directory of ${cat.en.toLowerCase()} across Miyazaki.`;

  return (
    <div className="space-y-6">
      <JsonLd
        data={collectionJsonLd({
          name: pageTitle,
          description: pageDescription,
          path: urlCategory(lang, params.genre, params.category),
          items,
        })}
      />
      <Breadcrumbs
        lang={lang}
        crumbs={[
          { label: "Play Miyazaki", href: urlHome(lang) },
          { label: genre[lang], href: urlGenre(lang, params.genre) },
          { label: cat[lang] },
        ]}
      />
      <div>
        <h1 className="font-display font-bold text-[28px] leading-tight text-text-primary">
          {catHeading(lang, genre, cat)}
        </h1>
        <p className="pm-mono text-[12px] text-text-secondary mt-1">
          {filtered.length} {SPOT_LABEL[lang]}
        </p>
      </div>

      <div className="space-y-3">
        <FeatureChips
          lang={lang}
          genre={params.genre}
          taxonomy={taxonomy}
          featureCounts={featCounts}
        />
        <AreaChips
          lang={lang}
          genre={params.genre}
          taxonomy={taxonomy}
          areaCounts={areaCounts}
        />
      </div>

      <FilterableList items={items} lang={lang} />
    </div>
  );
}
