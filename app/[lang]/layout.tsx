import Link from "next/link";
import { LANGS, SITE_NAME, SITE_TAGLINE, type Lang } from "@/lib/i18n";
import LangSwitch from "@/app/_components/LangSwitch";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href={`/${lang}`} className="no-underline">
            <div className="font-semibold text-slate-900 text-lg">{SITE_NAME[lang]}</div>
            <div className="text-xs text-slate-500 mt-0.5">{SITE_TAGLINE[lang]}</div>
          </Link>
          <LangSwitch lang={lang} />
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 mt-8">
        <div className="max-w-3xl mx-auto px-4 py-6 text-xs text-slate-500">
          {lang === "ja"
            ? "掲載情報は出典URLに基づいて記載しています。営業時間・料金は変更される場合があります。"
            : "All information links to a source URL. Hours and prices may change."}
        </div>
      </footer>
    </div>
  );
}
