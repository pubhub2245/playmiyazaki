import { LANGS, type Lang } from "@/lib/i18n";
import { Header } from "@/app/_components/Header";
import { Footer } from "@/app/_components/Footer";

const SKIP_LABEL = {
  ja: "本文へスキップ",
  en: "Skip to content",
};

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
      <a href="#main" className="pm-skip-link">
        {SKIP_LABEL[lang]}
      </a>
      <Header lang={lang} />
      <main id="main" tabIndex={-1} className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 outline-none">
        {children}
      </main>
      <Footer lang={lang} />
    </div>
  );
}
