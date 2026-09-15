import Link from "next/link";
import { WaveMark } from "./WaveMark";
import LangSwitch from "./LangSwitch";
import type { Lang } from "@/lib/i18n";
import { loadTaxonomy } from "@/lib/data";
import { genresWithListings } from "@/lib/coverage";
import { urlGenre } from "@/lib/url";

const SUBMIT_LABEL = {
  ja: "掲載を申請する",
  en: "Submit a listing",
};

export function Header({ lang }: { lang: Lang }) {
  const taxonomy = loadTaxonomy();
  const active = new Set(genresWithListings());
  const genres = taxonomy.genres.filter((g) => active.has(g.slug));
  return (
    <header className="border-b border-line bg-canvas/80 backdrop-blur">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link
          href={`/${lang}`}
          className="pm-touch inline-flex items-center gap-2 no-underline text-text-primary"
        >
          <WaveMark className="text-text-primary" />
          <span className="font-display font-bold text-base tracking-tight">Play Miyazaki</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-4 flex-1">
          {genres.map((g) => (
            <Link
              key={g.slug}
              href={urlGenre(lang, g.slug)}
              className="pm-touch inline-flex items-center text-sm text-text-primary no-underline hover:text-accent"
            >
              {g[lang]}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Link
            href={`/${lang}/submit`}
            className="pm-touch inline-flex items-center pm-mono text-[13px] text-accent no-underline"
          >
            {SUBMIT_LABEL[lang]}
          </Link>
          <LangSwitch lang={lang} />
        </div>
      </div>
      <nav className="sm:hidden max-w-4xl mx-auto px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1">
        {genres.map((g) => (
          <Link
            key={g.slug}
            href={urlGenre(lang, g.slug)}
            className="text-sm text-text-primary no-underline"
          >
            {g[lang]}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export { SUBMIT_LABEL };
