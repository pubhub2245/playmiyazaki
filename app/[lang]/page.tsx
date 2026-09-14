import type { Metadata } from "next";
import Link from "next/link";
import { loadAllListings, loadTaxonomy } from "@/lib/data";
import { SITE_NAME, SITE_TAGLINE, UI, type Lang } from "@/lib/i18n";
import { absolute, urlGenre, urlHome } from "@/lib/url";

type Props = { params: { lang: string } };

export function generateMetadata({ params }: Props): Metadata {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const url = absolute(urlHome(lang));
  return {
    title: SITE_NAME[lang],
    description: SITE_TAGLINE[lang],
    alternates: {
      canonical: url,
      languages: {
        ja: absolute(urlHome("ja")),
        en: absolute(urlHome("en")),
      },
    },
  };
}

export default function HomePage({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const listings = loadAllListings();
  const counts = new Map<string, number>();
  for (const l of listings) counts.set(l.genre, (counts.get(l.genre) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <p className="text-slate-700 text-sm">
        {lang === "ja"
          ? "宮崎で「遊ぶ」ための一覧。出典URL付きで、事実だけを載せています。"
          : "A directory for playing in Miyazaki. Only facts, always linked to a source."}
      </p>
      <div className="divide-y divide-slate-200 border border-slate-200 rounded">
        {taxonomy.genres.map((g) => {
          const count = counts.get(g.slug) ?? 0;
          return (
            <Link
              key={g.slug}
              href={urlGenre(lang, g.slug)}
              className="flex items-baseline justify-between px-4 py-3 no-underline hover:bg-slate-50"
            >
              <span className="text-slate-900 font-medium">{g[lang]}</span>
              <span className="text-sm text-slate-500">
                {count} {UI.spot_count[lang]}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
