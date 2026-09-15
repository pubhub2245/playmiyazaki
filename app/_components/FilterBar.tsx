import Link from "next/link";
import { UI, type Lang } from "@/lib/i18n";
import { urlArea, urlCategory } from "@/lib/url";
import type { Listing, Taxonomy } from "@/lib/types";

export function CategoryChips({
  lang,
  genre,
  taxonomy,
  activeCategory,
  categoryCounts,
}: {
  lang: Lang;
  genre: string;
  taxonomy: Taxonomy;
  activeCategory?: string | null;
  categoryCounts: Map<string, number>;
}) {
  const categories = (taxonomy.categories[genre] ?? []).filter(
    (c) => (categoryCounts.get(c.slug) ?? 0) > 0,
  );
  if (categories.length === 0) return null;
  return (
    <div>
      <div className="pm-mono text-[11px] text-text-secondary mb-2 uppercase tracking-wider">
        {UI.filter_category[lang]}
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Chip
            key={c.slug}
            href={urlCategory(lang, genre, c.slug)}
            active={activeCategory === c.slug}
            count={categoryCounts.get(c.slug) ?? 0}
          >
            {c[lang]}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function AreaChips({
  lang,
  genre,
  taxonomy,
  activeArea,
  areaCounts,
}: {
  lang: Lang;
  genre: string;
  taxonomy: Taxonomy;
  activeArea?: string | null;
  areaCounts: Map<string, number>;
}) {
  const areas = taxonomy.areas.filter((a) => (areaCounts.get(a.slug) ?? 0) > 0);
  if (areas.length === 0) return null;
  return (
    <div>
      <div className="pm-mono text-[11px] text-text-secondary mb-2 uppercase tracking-wider">
        {UI.filter_area[lang]}
      </div>
      <div className="flex flex-wrap gap-2">
        {areas.map((a) => (
          <Chip
            key={a.slug}
            href={urlArea(lang, genre, a.slug)}
            active={activeArea === a.slug}
            count={areaCounts.get(a.slug) ?? 0}
          >
            {a[lang]}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={"pm-chip " + (active ? "is-active" : "")}>
      <span>{children}</span>
      <span className="pm-chip-count">{count}</span>
    </Link>
  );
}

export function categoryCountsForGenre(listings: Listing[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of listings) {
    for (const c of l.category) m.set(c, (m.get(c) ?? 0) + 1);
  }
  return m;
}

export function areaCountsForGenre(listings: Listing[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of listings) m.set(l.area, (m.get(l.area) ?? 0) + 1);
  return m;
}
