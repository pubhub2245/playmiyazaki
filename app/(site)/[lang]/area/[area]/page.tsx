import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAllListings, loadTaxonomy } from "@/lib/data";
import { LANGS, parseLang, type Lang } from "@/lib/i18n";
import { absolute, urlArea, urlAreaAll, urlAreaIndex, urlHome } from "@/lib/url";
import {
  areaTotal,
  areasWithCrossGenrePages,
  genresInArea,
  hasCrossGenreAreaPage,
} from "@/lib/coverage";
import { Breadcrumbs } from "@/app/_components/Breadcrumbs";
import { FilterableList } from "@/app/_components/FilterableList";
import { JsonLd } from "@/app/_components/JsonLd";
import { collectionJsonLd } from "@/lib/jsonld";
import { GenreIcon } from "@/app/_components/GenreIcon";
import { RevealList } from "@/app/_components/RevealList";
import { Row } from "@/app/_components/Row";
import { listingToRow } from "@/lib/rows";

type Props = { params: { lang: string; area: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  const params: { lang: string; area: string }[] = [];
  for (const lang of LANGS) {
    for (const a of areasWithCrossGenrePages()) params.push({ lang, area: a });
  }
  return params;
}

type Labels = { ja: string; en: string; ko: string };

const SPOT_LABEL: Record<Lang, string> = { ja: "スポット", en: "places", ko: "스팟" };

const ALL_AREAS: Record<Lang, string> = {
  ja: "エリア一覧",
  en: "All areas",
  ko: "지역 목록",
};

const SEE_GENRE: Record<Lang, string> = {
  ja: "だけの一覧を見る",
  en: "See only this genre",
  ko: "이 장르만 보기",
};

function title(lang: Lang, area: Labels): string {
  if (lang === "ja") return `${area.ja}で遊ぶ｜サーフィン・キャンプ・食・ゴルフの一覧`;
  if (lang === "ko") return `${area.ko}에서 놀기｜서핑·캠핑·음식·골프 목록`;
  return `Things to do in ${area.en}: surf, camp, food and golf`;
}

function description(lang: Lang, area: Labels, total: number): string {
  if (lang === "ja") return `${area.ja}のサーフィン・キャンプ・食・ゴルフを、ジャンルごとに${total}件、出典URL付きで一覧にしています。`;
  if (lang === "ko") return `${area.ko}의 서핑·캠핑·음식·골프 ${total}곳을 장르별로 정리한 목록입니다. 모든 정보에 출처 URL이 있습니다.`;
  return `${total} places to surf, camp, eat and play golf in ${area.en}, grouped by genre, every one with a source link.`;
}

function heading(lang: Lang, area: Labels): string {
  if (lang === "ja") return `${area.ja}で遊ぶ`;
  if (lang === "ko") return `${area.ko}에서 놀기`;
  return `Things to do in ${area.en}`;
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = parseLang(params.lang);
  const taxonomy = loadTaxonomy();
  const area = taxonomy.areas.find((a) => a.slug === params.area);
  if (!area) return {};
  const languages: Record<string, string> = {};
  for (const l of LANGS) languages[l] = absolute(urlAreaAll(l, params.area));
  return {
    title: { absolute: title(lang, area) },
    description: description(lang, area, areaTotal(params.area)),
    alternates: { canonical: absolute(urlAreaAll(lang, params.area)), languages },
  };
}

export default function AreaAllGenresPage({ params }: Props) {
  const lang = parseLang(params.lang);
  const taxonomy = loadTaxonomy();
  const area = taxonomy.areas.find((a) => a.slug === params.area);
  if (!area || !hasCrossGenreAreaPage(params.area)) notFound();

  const inArea = loadAllListings().filter((l) => l.area === params.area);
  const genreLabel = new Map(taxonomy.genres.map((g) => [g.slug, g]));
  const groups = genresInArea(params.area);

  // Same order the reader sees: genre by genre, each sorted by Japanese name.
  const rowsByGenre = new Map(
    groups.map(({ genre }) => [
      genre,
      inArea
        .filter((l) => l.genre === genre)
        .sort((a, b) => a.name.ja.localeCompare(b.name.ja, "ja"))
        .map((l) => listingToRow(l, taxonomy, lang)),
    ]),
  );

  return (
    <div className="space-y-8">
      <JsonLd
        data={collectionJsonLd({
          name: heading(lang, area),
          description: description(lang, area, areaTotal(params.area)),
          path: urlAreaAll(lang, params.area),
          items: groups.flatMap(({ genre }) => rowsByGenre.get(genre) ?? []),
        })}
      />
      <Breadcrumbs
        lang={lang}
        crumbs={[
          { label: "Play Miyazaki", href: urlHome(lang) },
          { label: ALL_AREAS[lang], href: urlAreaIndex(lang) },
          { label: area[lang] },
        ]}
      />

      <div>
        <h1 className="font-display font-bold text-[28px] leading-tight text-text-primary">
          {heading(lang, area)}
        </h1>
        <p className="pm-mono text-[12px] text-text-secondary mt-1">
          {inArea.length} {SPOT_LABEL[lang]}
        </p>
      </div>

      <FilterableList
        items={inArea.map((l) => listingToRow(l, taxonomy, lang))}
        lang={lang}
        hideWhenEmpty
      />

      {groups.map(({ genre, count }) => {
        const g = genreLabel.get(genre);
        if (!g) return null;
        const rows = rowsByGenre.get(genre) ?? [];
        return (
          <section key={genre} className="space-y-3">
            <h2 className="flex items-center gap-3 font-display font-bold text-[20px] text-text-primary">
              <span className="text-text-primary">
                <GenreIcon genre={genre} />
              </span>
              <span>{g[lang]}</span>
              <span className="pm-mono text-[13px] font-normal text-text-secondary">
                {count} {SPOT_LABEL[lang]}
              </span>
            </h2>
            <RevealList>
              {rows.map((r) => (
                <Row key={r.slug} data={r} lang={lang} variant="small" />
              ))}
            </RevealList>
            <p className="text-[14px]">
              <Link href={urlArea(lang, genre, params.area)}>
                {lang === "ja"
                  ? `${area.ja}の${g.ja}${SEE_GENRE.ja}`
                  : lang === "ko"
                    ? `${area.ko}의 ${g.ko} 목록 보기`
                    : `${g.en} in ${area.en}`}
              </Link>
            </p>
          </section>
        );
      })}
    </div>
  );
}
