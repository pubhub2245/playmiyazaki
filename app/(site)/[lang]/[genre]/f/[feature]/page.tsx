import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingsByGenre, loadTaxonomy } from "@/lib/data";
import { LANGS, parseLang, pickHeading, type Lang } from "@/lib/i18n";
import { absolute, urlFeature, urlGenre, urlHome } from "@/lib/url";
import {
  areasWithListings,
  categoriesWithListings,
  featuresWithListings,
  genresWithListings,
  hasFeature,
} from "@/lib/coverage";
import { AreaChips, CategoryChips, areaCountsForGenre, categoryCountsForGenre } from "@/app/_components/FilterBar";
import { FeatureChips, featureCountsForGenre } from "@/app/_components/FeatureChips";
import { Breadcrumbs } from "@/app/_components/Breadcrumbs";
import { FilterableList } from "@/app/_components/FilterableList";
import { listingToRow } from "@/lib/rows";
import { JsonLd } from "@/app/_components/JsonLd";
import { collectionJsonLd } from "@/lib/jsonld";

type Props = { params: { lang: string; genre: string; feature: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  const params: { lang: string; genre: string; feature: string }[] = [];
  for (const lang of LANGS) {
    for (const g of genresWithListings()) {
      for (const f of featuresWithListings(g)) {
        params.push({ lang, genre: g, feature: f });
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

function featureDescription(
  lang: Lang,
  genre: { ja: string; en: string; ko: string },
  feature: { ja: string; en: string; ko: string },
): string {
  if (lang === "ja") return `出典で「${feature.ja}」と確認できた${genre.ja}スポットの一覧です。`;
  if (lang === "ko") return `출처에서 「${feature.ko}」이(가) 확인된 ${genre.ko} 스팟 목록입니다.`;
  return `Miyazaki ${genre.en.toLowerCase()} spots where "${feature.en.toLowerCase()}" is confirmed on the source.`;
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = parseLang(params.lang);
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const feature = (taxonomy.features[params.genre] ?? []).find((f) => f.slug === params.feature);
  if (!genre || !feature) return {};
  const languages: Record<string, string> = {};
  for (const l of LANGS) languages[l] = absolute(urlFeature(l, params.genre, params.feature));
  return {
    title: pickHeading(feature, lang),
    description: featureDescription(lang, genre, feature),
    alternates: {
      canonical: absolute(urlFeature(lang, params.genre, params.feature)),
      languages,
    },
  };
}

export default function FeaturePage({ params }: Props) {
  const lang = parseLang(params.lang);
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const feature = (taxonomy.features[params.genre] ?? []).find((f) => f.slug === params.feature);
  if (!genre || !feature || !hasFeature(params.genre, params.feature)) notFound();

  const filtered = listingsByGenre(params.genre)
    .filter((l) => l.features.includes(params.feature))
    .sort((a, b) => {
      const aArea = taxonomy.areas.find((x) => x.slug === a.area)?.ja ?? a.area;
      const bArea = taxonomy.areas.find((x) => x.slug === b.area)?.ja ?? b.area;
      const areaCmp = aArea.localeCompare(bArea, "ja");
      if (areaCmp !== 0) return areaCmp;
      return a.name.ja.localeCompare(b.name.ja, "ja");
    });

  const areaCounts = areaCountsForGenre(filtered);
  const catCounts = categoryCountsForGenre(filtered);
  const featCounts = featureCountsForGenre(listingsByGenre(params.genre));
  void areasWithListings(params.genre);
  void categoriesWithListings(params.genre);

  const items = filtered.map((l) => listingToRow(l, taxonomy, lang));
  const heading = pickHeading(feature, lang);
  const definition = featureDescription(lang, genre, feature);

  return (
    <div className="space-y-6">
      <JsonLd
        data={collectionJsonLd({
          name: heading,
          description: definition,
          path: urlFeature(lang, params.genre, params.feature),
          items,
        })}
      />
      <Breadcrumbs
        lang={lang}
        crumbs={[
          { label: "Play Miyazaki", href: urlHome(lang) },
          { label: genre[lang], href: urlGenre(lang, params.genre) },
          { label: feature[lang] },
        ]}
      />
      <div>
        <h1 className="font-display font-bold text-[28px] leading-tight text-text-primary">
          {heading}
        </h1>
        <p className="pm-mono text-[12px] text-text-secondary mt-1">
          {filtered.length} {SPOT_LABEL[lang]}
        </p>
        <p className="pm-prose mt-3">
          <span>{definition}</span>
        </p>
      </div>

      <div className="space-y-3">
        <FeatureChips
          lang={lang}
          genre={params.genre}
          taxonomy={taxonomy}
          activeFeature={params.feature}
          featureCounts={featCounts}
        />
        <CategoryChips
          lang={lang}
          genre={params.genre}
          taxonomy={taxonomy}
          categoryCounts={catCounts}
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
