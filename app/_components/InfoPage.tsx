import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import { absolute, urlHome } from "@/lib/url";
import { Breadcrumbs } from "@/app/_components/Breadcrumbs";

// Shared shell for the small informational pages (about, privacy, contact,
// disclosure). Same skeleton as /submit: crumbs → h1 → short sections.
// Nothing here is a listing; no rows, no chips, no button.

export type InfoSection = {
  heading?: string;
  body: ReactNode;
};

export type InfoContent = {
  title: string;
  metaDesc: string;
  lead?: string;
  sections: InfoSection[];
  updated?: string;
};

export const UPDATED_LABEL = { ja: "最終更新", en: "Last updated" };

export function infoMetadata(path: string, lang: Lang, content: InfoContent): Metadata {
  return {
    title: content.title,
    description: content.metaDesc,
    alternates: {
      canonical: absolute(`/${lang}${path}`),
      languages: {
        ja: absolute(`/ja${path}`),
        en: absolute(`/en${path}`),
      },
    },
  };
}

export function InfoPage({ lang, content }: { lang: Lang; content: InfoContent }) {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        lang={lang}
        crumbs={[
          { label: "Play Miyazaki", href: urlHome(lang) },
          { label: content.title },
        ]}
      />
      <h1 className="font-display font-bold text-[28px] leading-tight text-text-primary">
        {content.title}
      </h1>
      {content.lead && (
        <div className="pm-prose">
          <p>{content.lead}</p>
        </div>
      )}
      <div className="space-y-6">
        {content.sections.map((s, i) => (
          <section key={i} className="space-y-2">
            {s.heading && (
              <h2 className="pm-subhead">{s.heading}</h2>
            )}
            <div className="pm-prose space-y-2">{s.body}</div>
          </section>
        ))}
      </div>
      {content.updated && (
        <p className="pm-mono text-[12px] text-text-secondary">
          {UPDATED_LABEL[lang]} {content.updated}
        </p>
      )}
    </div>
  );
}
