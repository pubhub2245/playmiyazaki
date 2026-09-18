import type { Metadata } from "next";
import Link from "next/link";
import { loadTaxonomy } from "@/lib/data";
import { LANGS, parseLang, type Lang } from "@/lib/i18n";
import { absolute, urlAreaAll, urlAreaIndex, urlHome } from "@/lib/url";
import { AREA_MIN_COUNT, areaTotal, areasWithCrossGenrePages, genresInArea } from "@/lib/coverage";
import { Breadcrumbs } from "@/app/_components/Breadcrumbs";
import { JsonLd } from "@/app/_components/JsonLd";
import { collectionJsonLd } from "@/lib/jsonld";

type Props = { params: { lang: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

const SPOT_LABEL: Record<Lang, string> = { ja: "スポット", en: "places", ko: "스팟" };

const TITLE: Record<Lang, string> = {
  ja: "エリアから探す｜宮崎の市町村ごとの一覧",
  en: "Browse Miyazaki by area",
  ko: "지역으로 찾기｜미야자키 시·정·촌별 목록",
};

const HEADING: Record<Lang, string> = {
  ja: "エリアから探す",
  en: "Browse by area",
  ko: "지역으로 찾기",
};

const LEAD: Record<Lang, string> = {
  ja: `市町村を選ぶと、その市町村のサーフィン・キャンプ・食・ゴルフをまとめて見られます。掲載が${AREA_MIN_COUNT}件未満の市町村はページを作っていません（各ジャンルの一覧から見られます）。`,
  en: `Pick a municipality to see its surf spots, campsites, places to eat and golf courses on one page. Municipalities with fewer than ${AREA_MIN_COUNT} listings do not get their own page yet; they appear on the per-genre lists.`,
  ko: `시·정·촌을 고르면 그 지역의 서핑·캠핑·음식·골프를 한 페이지에서 볼 수 있습니다. 게재가 ${AREA_MIN_COUNT}곳 미만인 지역은 아직 페이지를 만들지 않았습니다(장르별 목록에서 볼 수 있습니다).`,
};

export function generateMetadata({ params }: Props): Metadata {
  const lang = parseLang(params.lang);
  const languages: Record<string, string> = {};
  for (const l of LANGS) languages[l] = absolute(urlAreaIndex(l));
  return {
    title: { absolute: TITLE[lang] },
    description: LEAD[lang],
    alternates: { canonical: absolute(urlAreaIndex(lang)), languages },
  };
}

export default function AreaIndexPage({ params }: Props) {
  const lang = parseLang(params.lang);
  const taxonomy = loadTaxonomy();
  const areaLabel = new Map(taxonomy.areas.map((a) => [a.slug, a]));
  const genreLabel = new Map(taxonomy.genres.map((g) => [g.slug, g]));
  const areas = areasWithCrossGenrePages();

  return (
    <div className="space-y-6">
      <JsonLd
        data={collectionJsonLd({
          name: HEADING[lang],
          description: LEAD[lang],
          path: urlAreaIndex(lang),
          items: areas
            .map((slug) => {
              const a = areaLabel.get(slug);
              return a ? { name: a[lang], href: urlAreaAll(lang, slug) } : null;
            })
            .filter((x): x is { name: string; href: string } => x !== null),
        })}
      />
      <Breadcrumbs
        lang={lang}
        crumbs={[{ label: "Play Miyazaki", href: urlHome(lang) }, { label: HEADING[lang] }]}
      />
      <div>
        <h1 className="font-display font-bold text-[28px] leading-tight text-text-primary">
          {HEADING[lang]}
        </h1>
        <p className="pm-prose mt-2">{LEAD[lang]}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {areas.map((slug) => {
          const a = areaLabel.get(slug);
          if (!a) return null;
          const genres = genresInArea(slug)
            .map(({ genre }) => genreLabel.get(genre)?.[lang])
            .filter((x): x is string => Boolean(x));
          return (
            <Link
              key={slug}
              href={urlAreaAll(lang, slug)}
              className="pm-touch block border border-line rounded-lg p-4 no-underline text-text-primary hover:bg-panel transition-colors"
            >
              <span className="flex items-baseline gap-2">
                <span className="flex-1 font-display font-bold text-[18px]">{a[lang]}</span>
                <span className="pm-mono text-[13px] text-text-secondary">
                  {areaTotal(slug)} {SPOT_LABEL[lang]}
                </span>
              </span>
              <span className="block text-[13px] text-text-secondary mt-1">
                {genres.join(lang === "ja" ? "・" : " / ")}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
