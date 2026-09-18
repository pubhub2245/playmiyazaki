import type { Metadata } from "next";
import Link from "next/link";
import { LANGS, type Lang } from "@/lib/i18n";
import { InfoPage, infoMetadata, type InfoContent } from "@/app/_components/InfoPage";

type Props = { params: { lang: string } };

const PATH = "/privacy";
const UPDATED = "2026-09-17";
const GOOGLE_ADS_POLICY = "https://policies.google.com/technologies/ads";
const GOOGLE_ADS_SETTINGS = "https://www.google.com/settings/ads";

function content(lang: Lang): InfoContent {
  if (lang === "en") {
    return {
      title: "Privacy policy",
      metaDesc: "What Play Miyazaki collects, how cookies are used for ads and measurement, and how to opt out.",
      lead: "Play Miyazaki has no sign-up, no forms and no comments. This page explains the little that is collected and why.",
      updated: UPDATED,
      sections: [
        {
          heading: "Information we collect",
          body: (
            <>
              <p>The site itself does not ask for your name, email or any other personal information.</p>
              <p>If you email us, we use the contents of your email only to reply and to fix the listing you wrote about. We do not add you to any list.</p>
            </>
          ),
        },
        {
          heading: "Access measurement",
          body: (
            <>
              <p>We use Google Search Console to see how many people reach the site from Google search. This shows aggregate numbers only and does not identify you.</p>
              <p>If we add an analytics tool (such as Google Analytics), it will use cookies to collect anonymous usage data such as pages viewed and the browser used. It will not be used to identify individuals.</p>
            </>
          ),
        },
        {
          heading: "Advertising",
          body: (
            <>
              <p>The site may show ads served by third parties, including Google AdSense. Ad providers may use cookies to show ads based on your earlier visits to this and other websites.</p>
              <p>
                You can turn off personalised ads from Google in your{" "}
                <a href={GOOGLE_ADS_SETTINGS} target="_blank" rel="noopener noreferrer">Google ad settings</a>. How Google uses data in advertising is described at{" "}
                <a href={GOOGLE_ADS_POLICY} target="_blank" rel="noopener noreferrer">policies.google.com/technologies/ads</a>.
              </p>
              <p>
                Some links to booking and shopping sites are affiliate links. See the{" "}
                <Link href={`/${lang}/disclosure`}>advertising and affiliate links page</Link>.
              </p>
            </>
          ),
        },
        {
          heading: "Cookies",
          body: (
            <p>You can block or delete cookies in your browser settings. The site keeps working without them; only ads and measurement are affected.</p>
          ),
        },
        {
          heading: "Accuracy of listings",
          body: (
            <p>Facts on each page come from the source URL shown on that page. Hours and prices change; check the official site before you go. Play Miyazaki is not responsible for loss caused by outdated information.</p>
          ),
        },
        {
          heading: "Changes and contact",
          body: (
            <p>
              This policy may change when the site changes. The date at the bottom shows the last update. Questions go to the{" "}
              <Link href={`/${lang}/contact`}>contact page</Link>.
            </p>
          ),
        },
      ],
    };
  }
  return {
    title: "プライバシーポリシー",
    metaDesc: "Play Miyazaki が取得する情報、広告・計測での Cookie の使い方、その止め方について。",
    lead: "Play Miyazaki には会員登録・投稿フォーム・口コミがありません。それでも集まる少しの情報について、ここに書きます。",
    updated: UPDATED,
    sections: [
      {
        heading: "取得する情報",
        body: (
          <>
            <p>サイト内で氏名・メールアドレスなどの個人情報を入力してもらうことはありません。</p>
            <p>メールでお問い合わせをいただいた場合、その内容は返信と掲載内容の訂正のためだけに使います。名簿などに登録することはありません。</p>
          </>
        ),
      },
      {
        heading: "アクセスの計測",
        body: (
          <>
            <p>Google 検索からの流入を知るために Google Search Console を使っています。集計された数字だけが分かり、個人は特定されません。</p>
            <p>今後、アクセス解析ツール（Google アナリティクスなど）を入れる場合、Cookie を使って閲覧ページやブラウザの種類などの匿名の利用状況を集めます。個人を特定する目的では使いません。</p>
          </>
        ),
      },
      {
        heading: "広告について",
        body: (
          <>
            <p>当サイトでは、第三者配信の広告サービス（Google AdSense など）を利用することがあります。広告配信事業者は、利用者の興味に応じた広告を表示するために Cookie を使うことがあります。</p>
            <p>
              Google の広告における Cookie の使い方は
              <a href={GOOGLE_ADS_POLICY} target="_blank" rel="noopener noreferrer">policies.google.com/technologies/ads</a>
              に書かれています。パーソナライズ広告は
              <a href={GOOGLE_ADS_SETTINGS} target="_blank" rel="noopener noreferrer">Google の広告設定</a>
              で無効にできます。
            </p>
            <p>
              予約サイトや通販サイトへのリンクの一部は紹介リンク（アフィリエイト）です。くわしくは
              <Link href={`/${lang}/disclosure`}>広告と紹介リンクについて</Link>をご覧ください。
            </p>
          </>
        ),
      },
      {
        heading: "Cookie の停止",
        body: (
          <p>Cookie はブラウザの設定で拒否・削除できます。拒否してもサイトの閲覧には支障ありません（広告と計測にだけ影響します）。</p>
        ),
      },
      {
        heading: "掲載情報の正確さ",
        body: (
          <p>各ページの事実は、そのページに示した出典URLに基づいています。営業時間や料金は変わることがあるので、出かける前に公式サイトで確認してください。掲載情報が古かったことによる損害について、当サイトは責任を負いません。</p>
        ),
      },
      {
        heading: "変更と連絡先",
        body: (
          <p>
            サイトの仕組みが変わったときは、このページも書き換えます。ページ下の日付が最後に更新した日です。ご質問は
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

export default function PrivacyPage({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  return <InfoPage lang={lang} content={content(lang)} />;
}
