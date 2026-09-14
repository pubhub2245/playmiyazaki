"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UI, otherLang, type Lang } from "@/lib/i18n";

export default function LangSwitch({ lang }: { lang: Lang }) {
  const pathname = usePathname() || `/${lang}`;
  const other = otherLang(lang);
  const swapped = pathname.replace(/^\/(ja|en)(?=\/|$)/, `/${other}`);
  return (
    <Link
      href={swapped}
      hrefLang={other}
      className="text-sm text-sky-700 whitespace-nowrap"
    >
      {UI.switch_language[lang]}
    </Link>
  );
}
