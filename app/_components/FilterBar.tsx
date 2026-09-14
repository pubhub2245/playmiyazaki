import Link from "next/link";
import { UI, type Lang } from "@/lib/i18n";
import { urlArea, urlCategory, urlGenre } from "@/lib/url";
import type { Taxonomy } from "@/lib/types";

export function FilterBar({
  lang,
  genre,
  taxonomy,
  activeCategory,
  activeArea,
  availableCategories,
  availableAreas,
}: {
  lang: Lang;
  genre: string;
  taxonomy: Taxonomy;
  activeCategory?: string | null;
  activeArea?: string | null;
  availableCategories: Set<string>;
  availableAreas: Set<string>;
}) {
  const categories = (taxonomy.categories[genre] ?? []).filter((c) =>
    availableCategories.has(c.slug),
  );
  const areas = taxonomy.areas.filter((a) => availableAreas.has(a.slug));

  return (
    <div className="space-y-3 text-sm">
      <div>
        <div className="text-xs text-slate-500 mb-1">{UI.filter_category[lang]}</div>
        <div className="flex flex-wrap gap-2">
          <FilterChip href={urlGenre(lang, genre)} active={!activeCategory}>
            {UI.all[lang]}
          </FilterChip>
          {categories.map((c) => (
            <FilterChip
              key={c.slug}
              href={urlCategory(lang, genre, c.slug)}
              active={activeCategory === c.slug}
            >
              {c[lang]}
            </FilterChip>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-slate-500 mb-1">{UI.filter_area[lang]}</div>
        <div className="flex flex-wrap gap-2">
          <FilterChip href={urlGenre(lang, genre)} active={!activeArea}>
            {UI.all[lang]}
          </FilterChip>
          {areas.map((a) => (
            <FilterChip
              key={a.slug}
              href={urlArea(lang, genre, a.slug)}
              active={activeArea === a.slug}
            >
              {a[lang]}
            </FilterChip>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        "px-2 py-1 rounded border no-underline text-xs " +
        (active
          ? "bg-sky-700 text-white border-sky-700"
          : "border-slate-300 text-slate-700 hover:bg-slate-100")
      }
    >
      {children}
    </Link>
  );
}
