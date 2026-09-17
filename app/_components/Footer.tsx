import Link from "next/link";
import { WaveMark } from "./WaveMark";
import type { Lang } from "@/lib/i18n";
import { SUBMIT_LABEL } from "./Header";

// One quiet line out to the separate MIYAZAKI PRIVATE brand. English only.
const PRIVATE_LINE = "MIYAZAKI PRIVATE — a private evening in Miyazaki →";

// Four small pages that ad and affiliate programs ask for. Same row, quiet.
const INFO_LINKS: { path: string; ja: string; en: string }[] = [
  { path: "about", ja: "運営者情報", en: "About" },
  { path: "privacy", ja: "プライバシーポリシー", en: "Privacy" },
  { path: "disclosure", ja: "広告と紹介リンクについて", en: "Ads & affiliate links" },
  { path: "contact", ja: "お問い合わせ", en: "Contact" },
];

const NOTICE = {
  ja: "掲載情報は出典URLに基づいています。営業時間・料金は変わることがあります。",
  en: "All information links to a source URL. Hours and prices may change.",
  ko: "게재 정보는 출처 URL을 근거로 합니다. 영업시간과 요금은 변경될 수 있습니다.",
};

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="mt-16 bg-text-primary text-on-dark">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <WaveMark className="text-on-dark" />
          <span className="font-display font-bold">Play Miyazaki</span>
        </div>
        <p className="text-[13px] text-on-dark-sub max-w-[40ch]">{NOTICE[lang]}</p>
        <Link
          href={`/${lang}/submit`}
          className="pm-touch pm-mono text-[13px] text-on-dark no-underline"
        >
          {SUBMIT_LABEL[lang]}
        </Link>
      </div>
      <nav
        aria-label={lang === "ja" ? "サイト情報" : "Site information"}
        className="max-w-4xl mx-auto px-4 pb-6 flex flex-wrap gap-x-5 gap-y-1"
      >
        {INFO_LINKS.map((l) => (
          <Link
            key={l.path}
            href={`/${lang}/${l.path}`}
            className="pm-touch pm-mono text-[13px] text-on-dark-sub no-underline hover:text-on-dark"
          >
            {l[lang]}
          </Link>
        ))}
      </nav>
      {lang === "en" && (
        <div className="max-w-4xl mx-auto px-4 pb-6">
          <a
            href="/private"
            className="pm-touch pm-mono text-[13px] text-on-dark-sub no-underline"
          >
            {PRIVATE_LINE}
          </a>
        </div>
      )}
    </footer>
  );
}
