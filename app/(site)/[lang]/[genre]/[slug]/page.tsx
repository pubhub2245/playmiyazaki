import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAllListings, loadTaxonomy } from "@/lib/data";
import { LANGS, NEARBY_HEADING, UI, parseLang, type Lang } from "@/lib/i18n";
import {
  absolute,
  googleMapsUrl,
  urlArea,
  urlAreaAll,
  urlCategory,
  urlFeature,
  urlGenre,
  urlHome,
  urlListing,
} from "@/lib/url";
import {
  FEATURE_MIN_COUNT,
  areaTotal,
  featureCount,
  hasCrossGenreAreaPage,
  nearbyInArea,
} from "@/lib/coverage";
import { Breadcrumbs } from "@/app/_components/Breadcrumbs";
import { Row } from "@/app/_components/Row";
import { RevealList } from "@/app/_components/RevealList";
import { listingToRow } from "@/lib/rows";
import { AffiliateLink } from "@/app/_components/AffiliateLink";
import { RAKUTEN_TRAVEL } from "@/lib/affiliate";

type Props = { params: { lang: string; genre: string; slug: string } };

const OPEN_SITE = { ja: "公式サイトを見る", en: "Visit the official site", ko: "공식 사이트 방문" };
const OPEN_MAP = { ja: "Google マップで開く", en: "Open in Google Maps", ko: "구글 지도에서 열기" };
const PRICE_NOTE = {
  ja: "出典の表記に基づく。確認日",
  en: "As written in the source. Verified",
  ko: "출처 표기 기준. 확인일",
};
const FEATURES_LABEL = { ja: "特徴", en: "Features", ko: "특징" };
const VERIFIED_LABEL = { ja: "確認済み", en: "Verified", ko: "확인 완료" };

// Link out to the cross-genre area page so every listing is a way into
// "everything in this town", not just "more of the same genre".
const AREA_ALL_LINK: Record<Lang, (area: string, n: number) => string> = {
  ja: (area, n) => `${area}で遊ぶ（全ジャンル ${n} スポット）`,
  en: (area, n) => `Everything to do in ${area} (${n} places)`,
  ko: (area, n) => `${area}에서 놀기 (전체 장르 ${n}곳)`,
};

/**
 * 宿泊で探している人だけに、予約サイトへの紹介リンクを1本出す。
 * 対象は「泊まる／湯につかる」種類だけ（サーファー向け宿・ゴルフ宿・温泉）。
 * サーフポイントや食のページには出さない（探しているものが違うため）。
 */
const STAY_CATEGORIES = new Set(["stay", "onsen"]);

const FIND_STAY: Record<Lang, string> = {
  ja: "楽天トラベルで宮崎の宿を探す",
  en: "Find places to stay in Miyazaki on Rakuten Travel",
  ko: "라쿠텐 트래블에서 미야자키 숙소 찾기",
};

export const dynamicParams = false;

export function generateStaticParams() {
  const listings = loadAllListings();
  const params: { lang: string; genre: string; slug: string }[] = [];
  for (const lang of LANGS) {
    for (const l of listings) {
      params.push({ lang, genre: l.genre, slug: l.slug });
    }
  }
  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = parseLang(params.lang);
  const listing = loadAllListings().find(
    (l) => l.genre === params.genre && l.slug === params.slug,
  );
  if (!listing) return {};
  const desc = listing.description?.[lang] || listing.address[lang];
  const languages: Record<string, string> = {};
  for (const l of LANGS) languages[l] = absolute(urlListing(l, params.genre, params.slug));
  return {
    title: listing.name[lang],
    description: desc,
    alternates: {
      canonical: absolute(urlListing(lang, params.genre, params.slug)),
      languages,
    },
  };
}

export default function ListingDetail({ params }: Props) {
  const lang = parseLang(params.lang);
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const listing = loadAllListings().find(
    (l) => l.genre === params.genre && l.slug === params.slug,
  );
  if (!genre || !listing) notFound();

  const catLabels = taxonomy.categories[params.genre] ?? [];
  const featureLabels = taxonomy.features[params.genre] ?? [];
  const area = taxonomy.areas.find((a) => a.slug === listing.area);
  const areaName = area?.[lang] ?? listing.area;

  const gmap =
    listing.google_maps_url ??
    googleMapsUrl(`${listing.address.ja} ${listing.name.ja}`);

  const jsonLd = buildJsonLd(
    listing,
    lang,
    absolute(urlListing(lang, listing.genre, listing.slug)),
  );
  const CHECK = UI.check_official[lang];
  const nearby = nearbyInArea(listing, 5).map((n) => listingToRow(n, taxonomy, lang));

  return (
    <article className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        lang={lang}
        crumbs={[
          { label: "Play Miyazaki", href: urlHome(lang) },
          { label: genre[lang], href: urlGenre(lang, params.genre) },
          { label: areaName, href: urlArea(lang, params.genre, listing.area) },
          { label: listing.name[lang] },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_18rem] gap-8">
        {/* Left column: name, chips, description, sole button */}
        <div className="space-y-4 min-w-0">
          <header className="space-y-3">
            <h1 className="font-display font-bold text-[32px] leading-tight text-text-primary">
              {listing.name[lang]}
            </h1>
            <div className="flex flex-wrap gap-2">
              {listing.category.map((c) => (
                <Link
                  key={c}
                  href={urlCategory(lang, params.genre, c)}
                  className="pm-chip"
                >
                  {catLabels.find((x) => x.slug === c)?.[lang] ?? c}
                </Link>
              ))}
              <Link
                href={urlArea(lang, params.genre, listing.area)}
                className="pm-chip"
              >
                {areaName}
              </Link>
            </div>
            {listing.status !== "open" && (
              <div className="pm-mono text-[13px] text-accent">
                {listing.status === "closed"
                  ? UI.status_closed[lang]
                  : UI.status_unknown[lang]}
              </div>
            )}
          </header>

          {listing.description?.[lang] && (
            <div className="pm-prose">
              <p>{listing.description[lang]}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {listing.website ? (
              <a
                className="pm-btn"
                href={listing.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {OPEN_SITE[lang]} <span aria-hidden>↗</span>
              </a>
            ) : (
              <span className="pm-mono text-[13px] text-text-secondary">
                {CHECK}
              </span>
            )}
            <a
              className="pm-mono text-[13px] text-accent"
              href={gmap}
              target="_blank"
              rel="noopener noreferrer"
            >
              {OPEN_MAP[lang]} <span aria-hidden>↗</span>
            </a>
          </div>

          {listing.category.some((c) => STAY_CATEGORIES.has(c)) && (
            <AffiliateLink
              lang={lang}
              program={RAKUTEN_TRAVEL}
              label={FIND_STAY[lang]}
            />
          )}
        </div>

        {/* Right column: facts table */}
        <aside className="min-w-0">
          <div className="bg-panel/60 rounded-lg p-4">
            <dl className="grid grid-cols-1 gap-y-3 text-[14px]">
              <FactItem
                label={UI.price[lang]}
                value={
                  listing.price?.[lang] ? (
                    <>
                      <span className="whitespace-pre-line">{listing.price[lang]}</span>
                      <div className="pm-mono text-[11px] text-text-secondary mt-1">
                        {PRICE_NOTE[lang]} {listing.verified_at}
                      </div>
                    </>
                  ) : (
                    <span className="text-text-secondary">{CHECK}</span>
                  )
                }
              />
              <FactItem label={UI.address[lang]} value={listing.address[lang]} />
              <FactItem
                label={UI.phone[lang]}
                value={
                  listing.phone ? (
                    <a
                      href={`tel:${listing.phone.replace(/[^\d+]/g, "")}`}
                      className="text-text-primary"
                    >
                      {listing.phone}
                    </a>
                  ) : (
                    <span className="text-text-secondary">{CHECK}</span>
                  )
                }
              />
              <FactItem
                label={UI.hours[lang]}
                value={
                  listing.hours?.[lang] ? (
                    <span className="whitespace-pre-line">{listing.hours[lang]}</span>
                  ) : (
                    <span className="text-text-secondary">{CHECK}</span>
                  )
                }
              />
              {listing.features.length > 0 && (
                <FactItem
                  label={FEATURES_LABEL[lang]}
                  value={
                    <span className="flex flex-wrap gap-1.5">
                      {listing.features.map((f) => {
                        const entry = featureLabels.find((x) => x.slug === f);
                        if (!entry) return null;
                        const label = entry[lang];
                        const canLink =
                          featureCount(params.genre, f) >= FEATURE_MIN_COUNT;
                        return canLink ? (
                          <Link
                            key={f}
                            href={urlFeature(lang, params.genre, f)}
                            className="pm-tag"
                          >
                            {label}
                          </Link>
                        ) : (
                          <span key={f} className="pm-tag pm-tag-plain">
                            {label}
                          </span>
                        );
                      })}
                    </span>
                  }
                />
              )}
              <div className="border-t border-line pt-3 space-y-2">
                <dt className="pm-mono text-[12px] text-text-secondary">
                  {UI.sources[lang]}
                </dt>
                <dd>
                  <ul className="space-y-1 list-none p-0 m-0">
                    {listing.sources.map((s) => (
                      <li key={s} className="pm-mono text-[12px] break-all">
                        <a href={s} target="_blank" rel="noopener noreferrer">
                          {s}
                        </a>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="pm-verified">
                <span className="text-accent" aria-hidden>
                  ✓
                </span>{" "}
                {VERIFIED_LABEL[lang]} {listing.verified_at}
              </div>
            </dl>
          </div>
        </aside>
      </div>

      {(nearby.length > 0 || hasCrossGenreAreaPage(listing.area)) && (
        <section className="space-y-3">
          <h2 className="pm-subhead">
            <span>{NEARBY_HEADING[lang]}</span>
            <span className="pm-mono text-text-secondary">{areaName}</span>
          </h2>
          {nearby.length > 0 && (
            <RevealList>
              {nearby.map((n) => (
                <Row key={n.slug} data={n} lang={lang} variant="small" />
              ))}
            </RevealList>
          )}
          {hasCrossGenreAreaPage(listing.area) && (
            <p>
              <Link href={urlAreaAll(lang, listing.area)} className="pm-mono text-[13px]">
                {AREA_ALL_LINK[lang](areaName, areaTotal(listing.area))} →
              </Link>
            </p>
          )}
        </section>
      )}
    </article>
  );
}

function FactItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-x-3 items-baseline">
      <dt className="pm-mono text-[12px] text-text-secondary">{label}</dt>
      <dd className="text-text-primary">{value}</dd>
    </div>
  );
}

type JsonLd = Record<string, unknown>;

const REGION_LABEL: Record<Lang, string> = {
  ja: "宮崎県",
  en: "Miyazaki",
  ko: "미야자키현",
};

function buildJsonLd(
  listing: ReturnType<typeof loadAllListings>[number],
  lang: Lang,
  url: string,
): JsonLd {
  const isPlace = listing.category.includes("point");
  const geo =
    listing.lat != null && listing.lng != null
      ? { "@type": "GeoCoordinates", latitude: listing.lat, longitude: listing.lng }
      : undefined;
  const base: JsonLd = {
    "@context": "https://schema.org",
    "@type": isPlace ? "TouristAttraction" : "LocalBusiness",
    name: listing.name[lang],
    url,
    address: {
      "@type": "PostalAddress",
      addressCountry: "JP",
      addressRegion: REGION_LABEL[lang],
      streetAddress: listing.address[lang],
    },
  };
  if (geo) base.geo = geo;
  if (listing.phone) base.telephone = listing.phone;
  if (listing.website) base.sameAs = [listing.website];
  if (listing.description?.[lang]) base.description = listing.description[lang];
  return base;
}
