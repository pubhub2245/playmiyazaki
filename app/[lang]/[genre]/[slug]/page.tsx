import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAllListings, loadTaxonomy } from "@/lib/data";
import { LANGS, NEARBY_HEADING, UI, type Lang } from "@/lib/i18n";
import { absolute, googleMapsUrl, urlArea, urlCategory, urlGenre, urlListing } from "@/lib/url";
import { nearbyInArea } from "@/lib/coverage";

type Props = { params: { lang: string; genre: string; slug: string } };

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
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const listing = loadAllListings().find(
    (l) => l.genre === params.genre && l.slug === params.slug,
  );
  if (!listing) return {};
  const desc = listing.description?.[lang] || listing.address[lang];
  return {
    title: listing.name[lang],
    description: desc,
    alternates: {
      canonical: absolute(urlListing(lang, params.genre, params.slug)),
      languages: {
        ja: absolute(urlListing("ja", params.genre, params.slug)),
        en: absolute(urlListing("en", params.genre, params.slug)),
      },
    },
  };
}

export default function ListingDetail({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const listing = loadAllListings().find(
    (l) => l.genre === params.genre && l.slug === params.slug,
  );
  if (!genre || !listing) notFound();

  const catLabels = taxonomy.categories[params.genre] ?? [];
  const area = taxonomy.areas.find((a) => a.slug === listing.area);
  const areaName = area?.[lang] ?? listing.area;

  const gmap =
    listing.google_maps_url ??
    googleMapsUrl(`${listing.address.ja} ${listing.name.ja}`);

  const jsonLd = buildJsonLd(listing, lang, absolute(urlListing(lang, listing.genre, listing.slug)));
  const CHECK = UI.check_official[lang];
  const nearby = nearbyInArea(listing, 5);

  return (
    <article className="space-y-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="text-xs text-slate-500">
        <Link href={`/${lang}`} className="no-underline">
          {UI.home[lang]}
        </Link>
        {UI.breadcrumb_sep[lang]}
        <Link href={urlGenre(lang, params.genre)} className="no-underline">
          {genre[lang]}
        </Link>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">{listing.name[lang]}</h1>
        <div className="text-xs text-slate-500 flex flex-wrap gap-x-2 gap-y-1">
          {listing.category.map((c) => (
            <Link
              key={c}
              href={urlCategory(lang, params.genre, c)}
              className="no-underline"
            >
              {catLabels.find((x) => x.slug === c)?.[lang] ?? c}
            </Link>
          ))}
          <span aria-hidden>·</span>
          <Link href={urlArea(lang, params.genre, listing.area)} className="no-underline">
            {areaName}
          </Link>
        </div>
        {listing.status !== "open" && (
          <div className="text-sm text-amber-700">
            {listing.status === "closed" ? UI.status_closed[lang] : UI.status_unknown[lang]}
          </div>
        )}
      </header>

      {listing.description?.[lang] && (
        <p className="text-slate-800">{listing.description[lang]}</p>
      )}

      <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
        <dt className="text-slate-500">{UI.address[lang]}</dt>
        <dd className="text-slate-900">{listing.address[lang]}</dd>

        <dt className="text-slate-500">{UI.phone[lang]}</dt>
        <dd className="text-slate-900">
          {listing.phone ? (
            <a href={`tel:${listing.phone.replace(/[^\d+]/g, "")}`}>{listing.phone}</a>
          ) : (
            <span className="text-slate-500">{CHECK}</span>
          )}
        </dd>

        <dt className="text-slate-500">{UI.website[lang]}</dt>
        <dd>
          {listing.website ? (
            <a href={listing.website} target="_blank" rel="noopener noreferrer">
              {listing.website}
            </a>
          ) : (
            <span className="text-slate-500">{CHECK}</span>
          )}
        </dd>

        <dt className="text-slate-500">{UI.map[lang]}</dt>
        <dd>
          <a href={gmap} target="_blank" rel="noopener noreferrer">
            {UI.map[lang]}
          </a>
        </dd>

        <dt className="text-slate-500">{UI.hours[lang]}</dt>
        <dd className="text-slate-900">
          {listing.hours?.[lang] ? (
            <span className="whitespace-pre-line">{listing.hours[lang]}</span>
          ) : (
            <span className="text-slate-500">{CHECK}</span>
          )}
        </dd>

        <dt className="text-slate-500">{UI.price[lang]}</dt>
        <dd className="text-slate-900">
          {listing.price?.[lang] ? (
            <span className="whitespace-pre-line">{listing.price[lang]}</span>
          ) : (
            <span className="text-slate-500">{CHECK}</span>
          )}
        </dd>
      </dl>

      {nearby.length > 0 && (
        <section className="border-t border-slate-200 pt-4 text-sm">
          <h2 className="text-xs font-semibold text-slate-600 mb-2">
            {NEARBY_HEADING[lang]}（{areaName}）
          </h2>
          <ul className="divide-y divide-slate-200 border border-slate-200 rounded">
            {nearby.map((n) => {
              const nCats = n.category
                .map((c) => catLabels.find((x) => x.slug === c)?.[lang] ?? c)
                .join(" / ");
              return (
                <li key={n.slug}>
                  <Link
                    href={urlListing(lang, n.genre, n.slug)}
                    className="flex items-baseline justify-between px-3 py-2 no-underline hover:bg-slate-50"
                  >
                    <span className="text-slate-900">{n.name[lang]}</span>
                    <span className="text-xs text-slate-500 ml-3">{nCats}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="border-t border-slate-200 pt-4 text-sm">
        <div className="text-xs text-slate-500 mb-1">{UI.sources[lang]}</div>
        <ul className="list-disc pl-5 space-y-1">
          {listing.sources.map((s) => (
            <li key={s}>
              <a href={s} target="_blank" rel="noopener noreferrer">
                {s}
              </a>
            </li>
          ))}
        </ul>
        <div className="text-xs text-slate-500 mt-2">
          {UI.verified_at[lang]}: {listing.verified_at}
        </div>
      </section>
    </article>
  );
}

type JsonLd = Record<string, unknown>;

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
      addressRegion: lang === "ja" ? "宮崎県" : "Miyazaki",
      streetAddress: listing.address[lang],
    },
  };
  if (geo) base.geo = geo;
  if (listing.phone) base.telephone = listing.phone;
  if (listing.website) base.sameAs = [listing.website];
  if (listing.description?.[lang]) base.description = listing.description[lang];
  return base;
}
