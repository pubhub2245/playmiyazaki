import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import {
  affiliateHref,
  affiliateImpressionSrc,
  type AffiliateProgram,
} from "@/lib/affiliate";

/**
 * 予約サイトへ送る紹介リンク。
 *
 * 見た目は既存の部品（pm-btn / pm-mono）だけを使う。新しい色も部品も足さない。
 * 広告であることを必ずボタンのすぐ横に書き、説明ページ（/disclosure）へつなぐ。
 */

const AD_LABEL: Record<Lang, string> = {
  ja: "※広告を含みます",
  en: "Affiliate link",
  ko: "※광고를 포함합니다",
};

type Props = {
  lang: Lang;
  program: AffiliateProgram;
  label: string;
};

export function AffiliateLink({ lang, program, label }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        className="pm-btn"
        href={affiliateHref(program)}
        target="_blank"
        rel="nofollow sponsored noopener noreferrer"
      >
        {label} <span aria-hidden>↗</span>
      </a>
      <Link
        href={`/${lang}/disclosure`}
        className="pm-mono text-[12px] text-text-secondary"
      >
        {AD_LABEL[lang]}
      </Link>
      {/* 表示回数の計測用（1px）。next/image を通すと外部へ渡す形が変わるため素の img を使う */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={affiliateImpressionSrc(program)}
        width={1}
        height={1}
        style={{ border: "none" }}
        alt=""
        loading="lazy"
      />
    </div>
  );
}
