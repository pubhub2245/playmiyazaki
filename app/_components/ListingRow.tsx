import Link from "next/link";
import type { Listing } from "@/lib/types";
import { UI, type Lang } from "@/lib/i18n";
import { urlListing } from "@/lib/url";

export function ListingRow({
  listing,
  lang,
  categoryLabels,
  areaLabels,
}: {
  listing: Listing;
  lang: Lang;
  categoryLabels: Record<string, { ja: string; en: string }>;
  areaLabels: Record<string, { ja: string; en: string }>;
}) {
  const catNames = listing.category
    .map((c) => categoryLabels[c]?.[lang] ?? c)
    .join(" / ");
  const areaName = areaLabels[listing.area]?.[lang] ?? listing.area;
  const desc = listing.description?.[lang] ?? null;

  return (
    <Link
      href={urlListing(lang, listing.genre, listing.slug)}
      className="block px-4 py-3 no-underline hover:bg-slate-50"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-medium text-slate-900">{listing.name[lang]}</div>
        <div className="text-xs text-slate-500 whitespace-nowrap">{areaName}</div>
      </div>
      <div className="text-xs text-slate-500 mt-1">{catNames}</div>
      {desc && <div className="text-sm text-slate-700 mt-1 line-clamp-2">{desc}</div>}
      {listing.status !== "open" && (
        <div className="text-xs text-amber-700 mt-1">
          {listing.status === "closed" ? UI.status_closed[lang] : UI.status_unknown[lang]}
        </div>
      )}
    </Link>
  );
}
