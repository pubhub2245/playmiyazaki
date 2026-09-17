import type { Metadata } from "next";
import Link from "next/link";
import { LANGS, type Lang } from "@/lib/i18n";
import { InfoPage, infoMetadata, type InfoContent } from "@/app/_components/InfoPage";

type Props = { params: { lang: string } };

const PATH = "/about";
const UPDATED = "2026-09-17";

function content(lang: Lang): InfoContent {
  if (lang === "en") {
    return {
      title: "About this site",
      metaDesc: "Who runs Play Miyazaki, what it lists, and how listings are chosen.",
      lead: "Play Miyazaki is a directory of places to surf, camp, eat and golf in Miyazaki Prefecture, Japan. Every entry links to a source URL.",
      updated: UPDATED,
      sections: [
        {
          heading: "Operator",
          body: (
            <>
              <p>Site name: Play Miyazaki (playmiyazaki.com)</p>
              <p>Operated by: Alpha Inc. (Kabushiki Kaisha Alpha), Miyazaki, Japan</p>
              <p>Representative: Junichiro Kawabata</p>
              <p>
                Contact: see the <Link href={`/${lang}/contact`}>contact page</Link>.
              </p>
            </>
          ),
        },
        {
          heading: "What we list",
          body: (
            <>
              <p>Shops, schools, campsites, restaurants, golf courses and other places in Miyazaki Prefecture, grouped by genre, category and area.</p>
              <p>Facts (address, hours, prices) are taken only from the source URL shown on each page. If the source does not say, the page says so. We do not write reviews, rankings or opinions, and we do not use photos.</p>
              <p>Listings are free and are never removed because of a fee. When a listing closes, it is marked as closed rather than deleted.</p>
            </>
          ),
        },
        {
          heading: "Advertising and affiliate links",
          body: (
            <p>
              The site may carry ads and affiliate links to cover its costs. They do not affect which places are listed or how they are described. Details are on the{" "}
              <Link href={`/${lang}/disclosure`}>advertising and affiliate links page</Link>.
            </p>
          ),
        },
        {
          heading: "Corrections and removal",
          body: (
            <p>
              If you run a listed place and something is wrong, or you want the listing removed, use the{" "}
              <Link href={`/${lang}/contact`}>contact page</Link>. To add a place, see{" "}
              <Link href={`/${lang}/submit`}>submit a listing</Link>.
            </p>
          ),
        },
      ],
    };
  }
  return {
    title: "運営者情報",
    metaDesc: "Play Miyazaki の運営者、掲載の方針、掲載情報の扱いについて。",
    lead: "Play Miyazaki は、宮崎県内でサーフィン・キャンプ・食・ゴルフを楽しむための場所の一覧サイトです。掲載情報はすべて出典URLに基づいています。",
    updated: UPDATED,
    sections: [
      {
        heading: "運営者",
        body: (
          <>
            <p>サイト名：Play Miyazaki（playmiyazaki.com）</p>
            <p>運営：株式会社Alpha（宮崎県）</p>
            <p>代表：川畑潤一郎</p>
            <p>
              連絡先：<Link href={`/${lang}/contact`}>お問い合わせ</Link>のページをご覧ください。
            </p>
          </>
        ),
      },
      {
        heading: "掲載しているもの",
        body: (
          <>
            <p>宮崎県内のお店・スクール・キャンプ場・飲食店・ゴルフ場などを、ジャンル・種類・エリアごとに一覧にしています。</p>
            <p>住所・営業時間・料金などの事実は、各ページに示した出典URLに書いてある値だけを載せています。出典に無い項目は「公式サイトで確認」と表示します。口コミ・ランキング・感想は書きません。写真も使いません。</p>
            <p>掲載は無料で、掲載料の有無で載せる・載せないを決めることはありません。閉業が分かった場合は削除せず「閉業」と表示します。</p>
          </>
        ),
      },
      {
        heading: "広告と紹介リンクについて",
        body: (
          <p>
            運営費をまかなうため、サイト内に広告や紹介リンク（アフィリエイト）を置くことがあります。広告の有無で掲載内容や順番を変えることはありません。くわしくは
            <Link href={`/${lang}/disclosure`}>広告と紹介リンクについて</Link>をご覧ください。
          </p>
        ),
      },
      {
        heading: "訂正・削除のご依頼",
        body: (
          <p>
            掲載内容の誤り、閉業、掲載の取り下げは<Link href={`/${lang}/contact`}>お問い合わせ</Link>からお知らせください。新しく載せたい場合は
            <Link href={`/${lang}/submit`}>掲載を申請する</Link>をご覧ください。
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

export default function AboutPage({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  return <InfoPage lang={lang} content={content(lang)} />;
}
