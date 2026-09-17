import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "./JsonLd";

export type Crumb = { label: string; href?: string };

const BREADCRUMB_LABEL: Record<Lang, string> = {
  ja: "パンくず",
  en: "Breadcrumb",
  ko: "이동 경로",
};

export function Breadcrumbs({ crumbs, lang }: { crumbs: Crumb[]; lang: Lang }) {
  return (
    <nav className="pm-crumbs" aria-label={BREADCRUMB_LABEL[lang]}>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {crumbs.map((c, i) => (
        <span key={i}>
          {i > 0 && <span aria-hidden> {"›"} </span>}
          {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}
