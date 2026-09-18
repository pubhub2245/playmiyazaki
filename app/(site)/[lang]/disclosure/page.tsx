import type { Metadata } from "next";
import Link from "next/link";
import { LANGS, type Lang } from "@/lib/i18n";
import { InfoPage, infoMetadata, type InfoContent } from "@/app/_components/InfoPage";

type Props = { params: { lang: string } };

const PATH = "/disclosure";
const UPDATED = "2026-09-17";

function content(lang: Lang): InfoContent {
  if (lang === "en") {
    return {
      title: "Advertising and affiliate links",
      metaDesc: "How Play Miyazaki is funded: ads and affiliate links, and the rules that keep them separate from the listings.",
      lead: "Play Miyazaki is free to use and free to be listed on. Running costs are covered by ads and affiliate links. This page says how that works.",
      updated: UPDATED,
      sections: [
        {
          heading: "Affiliate links",
          body: (
            <>
              <p>Some links to booking sites (hotels, golf courses, activities) and to shops that sell gear are affiliate links. If you book or buy through one, Play Miyazaki may receive a commission from that site. The price you pay does not change.</p>
              <p>Affiliate links are marked with the word “affiliate” next to the link. Links to a place’s official site and to Google Maps are never affiliate links.</p>
              <p>Programs we plan to use: Rakuten Affiliate (Rakuten Travel, Rakuten GORA), Moshimo Affiliate (Jalan), Amazon Associates. Live since September 2026: Rakuten Travel, through Moshimo Affiliate. It appears as a single “Find places to stay in Miyazaki on Rakuten Travel” button on town pages and on pages for places you sleep at or bathe at, and nowhere else. When another program goes live, it is named here with the wording that program requires.</p>
            </>
          ),
        },
        {
          heading: "Ads",
          body: (
            <>
              <p>The site may show ads served by Google AdSense. Ads are labelled “Ad” and sit apart from the listings. We do not sell ad space to listed businesses directly.</p>
              <p>
                How ad cookies work and how to opt out is on the{" "}
                <Link href={`/${lang}/privacy`}>privacy policy</Link>.
              </p>
            </>
          ),
        },
        {
          heading: "What ads and links do not change",
          body: (
            <>
              <p>Which places are listed. Every place we can verify from a source URL is listed, whether or not it has an affiliate program.</p>
              <p>The order of the lists. Lists are sorted by category and area, not by commission.</p>
              <p>The facts on each page. Hours, prices and addresses come only from the source URL.</p>
              <p>If a paid “featured” slot is ever offered to businesses, it will carry a “Featured” label and will not change the facts shown.</p>
            </>
          ),
        },
        {
          heading: "Questions",
          body: (
            <p>
              Use the <Link href={`/${lang}/contact`}>contact page</Link>.
            </p>
          ),
        },
      ],
    };
  }
  return {
    title: "広告と紹介リンクについて",
    metaDesc: "Play Miyazaki の運営費のまかない方（広告・紹介リンク）と、掲載内容に影響させないための決まり。",
    lead: "Play Miyazaki は閲覧も掲載も無料です。運営費は広告と紹介リンク（アフィリエイト）でまかないます。その仕組みをここに書きます。",
    updated: UPDATED,
    sections: [
      {
        heading: "紹介リンク（アフィリエイト）",
        body: (
          <>
            <p>宿・ゴルフ場・体験の予約サイトや、道具を売る通販サイトへのリンクの一部は紹介リンクです。そのリンクから予約・購入があると、そのサイトから当サイトに紹介料が支払われることがあります。利用者が払う金額は変わりません。</p>
            <p>紹介リンクには、リンクのそばに「紹介リンク」と書きます。各スポットの公式サイトと Google マップへのリンクは紹介リンクではありません。</p>
            <p>参加予定のプログラム：楽天アフィリエイト（楽天トラベル・楽天GORA）、もしもアフィリエイト（じゃらん）、Amazon アソシエイト。2026年9月から、もしもアフィリエイト経由の楽天トラベルを置いています。出る場所は、市町村ごとのページと、泊まる・湯につかる種類のスポット（サーファー向け宿・ゴルフ宿・温泉）のページで、「楽天トラベルで宮崎の宿を探す」ボタン1つだけです。ほかのプログラムを始めたときは、そのプログラムが求める表記とあわせてここに名前を載せます。</p>
          </>
        ),
      },
      {
        heading: "広告",
        body: (
          <>
            <p>当サイトでは Google AdSense による広告を表示することがあります。広告には「広告」と表示し、スポットの一覧とは分けて置きます。掲載されているお店・施設に広告枠を直接売ることはしていません。</p>
            <p>
              広告で使う Cookie と、その止め方は
              <Link href={`/${lang}/privacy`}>プライバシーポリシー</Link>に書いています。
            </p>
          </>
        ),
      },
      {
        heading: "広告や紹介リンクで変えないこと",
        body: (
          <>
            <p>載せる・載せない。出典URLで確認できるスポットは、紹介プログラムの有無にかかわらず載せます。</p>
            <p>一覧の並び順。並びは種類とエリアで決めていて、紹介料では決めていません。</p>
            <p>各ページの事実。営業時間・料金・住所は出典URLに書いてある値だけです。</p>
            <p>将来、事業者向けの有料「掲載枠」を始めた場合は「掲載枠」と表示し、事実の内容は変えません。</p>
          </>
        ),
      },
      {
        heading: "ご質問",
        body: (
          <p>
            <Link href={`/${lang}/contact`}>お問い合わせ</Link>からどうぞ。
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

export default function DisclosurePage({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  return <InfoPage lang={lang} content={content(lang)} />;
}
