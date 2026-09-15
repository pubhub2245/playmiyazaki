import Link from "next/link";
import type { Lang } from "@/lib/i18n";

export type RowData = {
  slug: string;
  href: string;
  name: string;
  description: string | null;
  categoryLabel: string;
  areaLabel: string;
  verifiedAt: string;
  featured?: boolean;
};

export function monogramText(name: string): string {
  if (!name) return "?";
  const first = name.trim().charAt(0);
  const code = first.codePointAt(0) ?? 0;
  const isAscii = code < 128;
  if (isAscii) {
    const two = name.trim().slice(0, 2).toUpperCase();
    return two;
  }
  return first;
}

const VERIFIED_LABEL = {
  ja: "確認",
  en: "Verified",
};

const CATEGORY_LABEL = {
  ja: "種類",
  en: "Type",
};

const AREA_LABEL = {
  ja: "エリア",
  en: "Area",
};

const FEATURED_LABEL = {
  ja: "掲載枠",
  en: "Featured",
};

export function Row({
  data,
  lang,
  variant = "default",
}: {
  data: RowData;
  lang: Lang;
  variant?: "default" | "small";
}) {
  const small = variant === "small";
  return (
    <li
      className={
        "pm-row " +
        (data.featured ? "pm-row-featured " : "") +
        "relative flex items-start gap-3 px-3 sm:px-4 py-3"
      }
    >
      <span
        aria-hidden
        className={"pm-monogram " + (small ? "pm-monogram-sm" : "")}
      >
        {monogramText(data.name)}
      </span>
      <Link
        href={data.href}
        className="pm-touch flex-1 min-w-0 no-underline text-text-primary block"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className={
                "font-display font-bold text-text-primary " +
                (small ? "text-[16px]" : "text-[18px]") +
                " leading-tight"
              }
            >
              {data.name}
            </div>
            {data.description && !small && (
              <div className="text-[14px] text-text-secondary mt-1 line-clamp-2">
                {data.description}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {data.featured && (
              <span className="pm-featured-label">{FEATURED_LABEL[lang]}</span>
            )}
            <span className="pm-verified">
              {VERIFIED_LABEL[lang]} {data.verifiedAt}
            </span>
          </div>
        </div>
        {!small && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            <div className="pm-fact">
              <span className="pm-fact-label">{CATEGORY_LABEL[lang]}</span>
              <span className="pm-fact-leader" aria-hidden />
              <span className="pm-fact-value">{data.categoryLabel}</span>
            </div>
            <div className="pm-fact">
              <span className="pm-fact-label">{AREA_LABEL[lang]}</span>
              <span className="pm-fact-leader" aria-hidden />
              <span className="pm-fact-value">{data.areaLabel}</span>
            </div>
          </div>
        )}
        {small && (
          <div className="mt-1 pm-fact">
            <span className="pm-fact-label">{AREA_LABEL[lang]}</span>
            <span className="pm-fact-leader" aria-hidden />
            <span className="pm-fact-value">{data.areaLabel}</span>
          </div>
        )}
      </Link>
    </li>
  );
}
