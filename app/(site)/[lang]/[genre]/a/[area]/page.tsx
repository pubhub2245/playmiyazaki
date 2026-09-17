import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingsByGenre, loadTaxonomy } from "@/lib/data";
import { LANGS, parseLang, type Lang } from "@/lib/i18n";
import { absolute, urlArea, urlGenre, urlHome } from "@/lib/url";
import {
  areasWithListings,
  genresWithListings,
  hasArea,
} from "@/lib/coverage";
import { CategoryChips, categoryCountsForGenre } from "@/app/_components/FilterBar";
import { FeatureChips, featureCountsForGenre } from "@/app/_components/FeatureChips";
import { Breadcrumbs } from "@/app/_components/Breadcrumbs";
import { FilterableList } from "@/app/_components/FilterableList";
import { listingToRow } from "@/lib/rows";
import { JsonLd } from "@/app/_components/JsonLd";
import { collectionJsonLd } from "@/lib/jsonld";

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

const SPOT_LABEL: Record<Lang, string> = {
  ja: "スポット",
  en: "places",
  ko: "스팟",
};

function areaTitle(
  lang: Lang,
  genre: { ja: string; en: string; ko: string },
  area: { ja: string; en: string; ko: string },
): string {
  if (lang === "ja") return `${area.ja}の${genre.ja}一覧`;
  if (lang === "ko") return `${area.ko}의 ${genre.ko} 목록`;
  return `${genre.en} in ${area.en}`;
}

function areaDescription(
  lang: Lang,
  genre: { ja: string; en: string; ko: string },
  area: { ja: string; en: string; ko: string },
): string {
  if (lang === "ja") return `${area.ja}の${genre.ja}を出典URL付きで一覧にしています。`;
  if (lang === "ko") return `${area.ko}의 ${genre.ko}을(를) 출처 URL과 함께 정리한 목록입니다.`;
  return `A source-linked directory of ${genre.en.toLowerCase()} in ${area.en}.`;
}

function areaHeading(
  lang: Lang,
  genre: { ja: string; en: string; ko: string },
  area: { ja: string; en: string; ko: string },
): string {
  if (lang === "ja") return `${area.ja}の${genre.ja}`;
  if (lang === "ko") return `${area.ko}의 ${genre.ko}`;
  return `${genre.en} in ${area.en}`;
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = parseLang(params.lang);
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const area = taxonomy.areas.find((a) => a.slug === params.area);
  if (!genre || !area) return {};
  const languages: Record<string, string> = {};
  for (const l of LANGS) languages[l] = absolute(urlArea(l, params.genre, params.area));
  return {
    title: areaTitle(lang, genre, area),
    description: areaDescription(lang, genre, area),
    alternates: {
      canonical: absolute(urlArea(lang, params.genre, params.area)),
      languages,
    },
  };
}

export default function AreaPage({ params }: Props) {
  const lang = parseLang(params.lang);
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const area = taxonomy.areas.find((a) => a.slug === params.area);
  if (!genre || !area || !hasArea(params.genre, params.area)) notFound();

  const filtered = listingsByGenre(params.genre)
    .filter((l) => l.area === params.area)
    .sort((a, b) => a.name.ja.localeCompare(b.name.ja, "ja"));

  const catCounts = categoryCountsForGenre(filtered);
  const featCounts = featureCountsForGenre(filtered);
  const items = filtered.map((l) => listingToRow(l, taxonomy, lang));
  const pageTitle =
    lang === "ja" ? `${area.ja}の${genre.ja}` : `${genre.en} in ${area.en}`;
  const pageDescription =
    lang === "ja"
      ? `${area.ja}の${genre.ja}を出典URL付きで一覧にしています。`
      : `A source-linked directory of ${genre.en.toLowerCase()} in ${area.en}.`;

  return (
    <div className="space-y-6">
      <JsonLd
        data={collectionJsonLd({
          name: pageTitle,
          description: pageDescription,
          path: urlArea(lang, params.genre, params.area),
          items,
        })}
      />
      <Breadcrumbs
        lang={lang}
        crumbs={[
          { label: "Play Miyazaki", href: urlHome(lang) },
          { label: genre[lang], href: urlGenre(lang, params.genre) },
          { label: area[lang] },
        ]}
      />
      <div>
        <h1 className="font-display font-bold text-[28px] leading-tight text-text-primary">
          {areaHeading(lang, genre, area)}
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
        <CategoryChips
          lang={lang}
          genre={params.genre}
          taxonomy={taxonomy}
          categoryCounts={catCounts}
        />
      </div>

      <FilterableList items={items} lang={lang} />
    </div>
  );
}
