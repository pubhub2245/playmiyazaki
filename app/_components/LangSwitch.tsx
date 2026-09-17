"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANGS, type Lang } from "@/lib/i18n";

const LABELS: Record<Lang, string> = {
  ja: "日本語",
  en: "English",
  ko: "한국어",
};

export default function LangSwitch({ lang }: { lang: Lang }) {
  const pathname = usePathname() || `/${lang}`;
  return (
    <div className="flex items-center gap-2">
      {LANGS.filter((l) => l !== lang).map((other) => {
        const swapped = pathname.replace(/^\/(ja|en|ko)(?=\/|$)/, `/${other}`);
        return (
          <Link
            key={other}
            href={swapped}
            hrefLang={other}
            className="text-sm text-sky-700 whitespace-nowrap"
          >
            {LABELS[other]}
          </Link>
        );
      })}
    </div>
  );
}
