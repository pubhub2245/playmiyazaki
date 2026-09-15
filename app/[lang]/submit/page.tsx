import type { Metadata } from "next";
import { LANGS, type Lang } from "@/lib/i18n";
import { absolute, urlHome } from "@/lib/url";
import { Breadcrumbs } from "@/app/_components/Breadcrumbs";

type Props = { params: { lang: string } };

const T = {
  ja: {
    title: "掲載を申請する",
    body: "掲載は無料です。公式サイトなど出典になるページのURLを添えてお知らせください。受付窓口は準備中です。",
    prep: "準備中",
    metaDesc: "宮崎の遊びスポットの掲載申請について。掲載は無料、出典URLが必要です。",
  },
  en: {
    title: "Submit a listing",
    body: "Listings are free. Send us the URL of a page (an official site works best) that can serve as a source. The submission form is on the way.",
    prep: "Coming soon",
    metaDesc: "How to submit a Miyazaki listing. Free, but a source URL is required.",
  },
};

const submitUrl = (lang: Lang) => `/${lang}/submit`;

export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  return {
    title: T[lang].title,
    description: T[lang].metaDesc,
    alternates: {
      canonical: absolute(submitUrl(lang)),
      languages: {
        ja: absolute(submitUrl("ja")),
        en: absolute(submitUrl("en")),
      },
    },
  };
}

export default function SubmitPage({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const t = T[lang];
  return (
    <div className="space-y-6">
      <Breadcrumbs
        lang={lang}
        crumbs={[
          { label: "Play Miyazaki", href: urlHome(lang) },
          { label: t.title },
        ]}
      />
      <h1 className="font-display font-bold text-[28px] leading-tight text-text-primary">
        {t.title}
      </h1>
      <div className="pm-prose">
        <p>{t.body}</p>
      </div>
      <p className="pm-mono text-[13px] text-text-secondary">{t.prep}</p>
    </div>
  );
}
