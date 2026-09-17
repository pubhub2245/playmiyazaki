import type { Metadata } from "next";
import { LANGS, parseLang, type Lang } from "@/lib/i18n";
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
  ko: {
    title: "게재 신청하기",
    body: "게재는 무료입니다. 공식 사이트 등 출처가 될 페이지 URL을 함께 알려 주세요. 접수 창구는 준비 중입니다.",
    prep: "준비 중",
    metaDesc: "미야자키 여행 스팟 게재 신청 안내. 게재는 무료이며 출처 URL이 필요합니다.",
  },
};

const submitUrl = (lang: Lang) => `/${lang}/submit`;

export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = parseLang(params.lang);
  const languages: Record<string, string> = {};
  for (const l of LANGS) languages[l] = absolute(submitUrl(l));
  return {
    title: T[lang].title,
    description: T[lang].metaDesc,
    alternates: {
      canonical: absolute(submitUrl(lang)),
      languages,
    },
  };
}

export default function SubmitPage({ params }: Props) {
  const lang = parseLang(params.lang);
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
