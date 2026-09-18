import type { Metadata } from "next";
import Link from "next/link";
import { LANGS, type Lang } from "@/lib/i18n";
import { InfoPage, infoMetadata, type InfoContent } from "@/app/_components/InfoPage";

type Props = { params: { lang: string } };

const PATH = "/contact";
const UPDATED = "2026-09-17";

// Same variable the MIYAZAKI PRIVATE request page uses. Until it is set on
// Vercel the page says the desk is not open yet, instead of showing a broken
// mailto. No form: forms are on the "never" list in CLAUDE.md.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

function content(lang: Lang): InfoContent {
  const mail = CONTACT_EMAIL ? (
    <p>
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
    </p>
  ) : (
    <p className="pm-mono text-[13px] text-text-secondary">
      {lang === "ja" ? "受付窓口は準備中です" : "Contact desk coming soon"}
    </p>
  );

  if (lang === "en") {
    return {
      title: "Contact",
      metaDesc: "How to reach Play Miyazaki about a listing, a correction, or removal.",
      lead: "Play Miyazaki has no contact form. Email is the only channel, and it is read by the operator.",
      updated: UPDATED,
      sections: [
        {
          heading: "Email",
          body: (
            <>
              {mail}
              <p>Please write in Japanese or English. Put the name of the place and the page URL in the message so we can find it.</p>
            </>
          ),
        },
        {
          heading: "What we can help with",
          body: (
            <>
              <p>Corrections to hours, prices, address or phone (send the official page that shows the right value).</p>
              <p>Reporting a closed or moved place.</p>
              <p>Asking for a listing to be taken down. Owners can have their listing removed at any time, free of charge.</p>
              <p>
                Adding a new place: see <Link href={`/${lang}/submit`}>submit a listing</Link>.
              </p>
            </>
          ),
        },
        {
          heading: "What we cannot do",
          body: (
            <p>We do not take bookings, forward messages to a listed place, or answer questions about a place on its behalf. Please contact the place directly through its official site.</p>
          ),
        },
        {
          heading: "Operator",
          body: (
            <p>
              Alpha Inc., Miyazaki, Japan. See <Link href={`/${lang}/about`}>about this site</Link>.
            </p>
          ),
        },
      ],
    };
  }
  return {
    title: "お問い合わせ",
    metaDesc: "Play Miyazaki への連絡方法。掲載内容の訂正、閉業の連絡、掲載の取り下げについて。",
    lead: "Play Miyazaki にはお問い合わせフォームがありません。連絡はメールだけで、運営者が読みます。",
    updated: UPDATED,
    sections: [
      {
        heading: "メール",
        body: (
          <>
            {mail}
            <p>お店・施設の名前と、該当ページのURLを書いてください。すぐに探せます。</p>
          </>
        ),
      },
      {
        heading: "受け付けていること",
        body: (
          <>
            <p>営業時間・料金・住所・電話番号の訂正（正しい値が書かれた公式ページを添えてください）。</p>
            <p>閉業・移転のお知らせ。</p>
            <p>掲載の取り下げ。掲載されているお店・施設の方は、いつでも無料で取り下げられます。</p>
            <p>
              新しく載せたい場合は<Link href={`/${lang}/submit`}>掲載を申請する</Link>をご覧ください。
            </p>
          </>
        ),
      },
      {
        heading: "できないこと",
        body: (
          <p>予約の受け付け、掲載先への伝言、掲載先に代わっての回答はしていません。お店・施設への連絡は、各ページの公式サイトからお願いします。</p>
        ),
      },
      {
        heading: "運営者",
        body: (
          <p>
            株式会社Alpha（宮崎県）。くわしくは<Link href={`/${lang}/about`}>運営者情報</Link>をご覧ください。
          </p>
        ),
      },
    ],
  };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  return infoMetadata(PATH, lang, content(lang));
}

export default function ContactPage({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  return <InfoPage lang={lang} content={content(lang)} />;
}
