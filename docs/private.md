# MIYAZAKI PRIVATE 方針

`/private` 配下は、playmiyazaki.com の中にあるが **別ブランド** のページ。
この文書が `/private` の唯一の方針。ここに無いものは作らない。

## これは何か

playmiyazaki.com（無料の事実データベース）はそのまま育て続ける。その上に、
外国人富裕層向けの別ブランド **MIYAZAKI PRIVATE** を載せる。

## 旗印：Zero-Crowd Japan

宮崎を「京都の反対（混まない日本）」として売る。英語トップ（/en）と /private のコピーは
この旗に沿わせる。京都・東京を既に知っている客が対象。

## 運営者は英語を話さない前提

当日の英語は外注ホスト、客との英文のやり取りは設計側の Claude が下書きする。
この前提を崩す設計（運営者が英語で対応する前提の機能）は作らない。

## 商品は上下2段＋付随2つ

| 段 | 商品 | 価格 | 売り方 |
|---|---|---|---|
| 上 | MIYAZAKI AFTER DARK（18:00–22:30、2〜4名、宮崎牛個室→焼酎→地元バー→徒歩） | 2名 ¥180,000／3名 ¥210,000／4名 ¥240,000 | /private の問い合わせ制 |
| 下 | Nishitachi Night with a Local（3時間、2〜6名、週2日開催） | 1人 ¥25,000 | GetYourGuide・Viator・Airbnb Experiences に掲載（アカウントは運営者が作る） |
| 付随 | Local on Call（旅行中の英語チャット窓口、最長7日） | 1組 ¥15,000 | /private から申込。案内・送迎はしない（情報提供のみ） |
| 付随 | 7-Day Southern Kyushu Route（料金つき道順の PDF） | $49（当面は無料サンプル） | /private から申込。listing データから生成し季節ごとに更新 |

上段は英語だけの2ページ＋問い合わせフォームで運用する。予約・決済はしない。
問い合わせをメールで受けて、運営者が返信して確定する。

## Play Miyazaki 側のルールとの関係

`/private` に **適用しない** もの：
- 評価語なし（Play Miyazaki 側の「絶景・最高・おすすめ」禁止）
- フォームなし・予約なし
- 写真なし（将来、運営者が自分で撮った写真が揃ったら使う）

`/private` にも **適用する** もの：
- 架空の店を作らない
- 店名は提携が決まるまで種類で書く（a wagyu restaurant, a local bar など）
- 事実（時間・人数・含まれるもの）は正確に
- listing データ（`data/listings/`）は読み取り専用で共用してよい

## やらないこと

- 実在の店名・人名・ホテル名・車会社名を載せる（提携が決まっていない）
- 写真・素材画像・アイコン・地図・アニメーション
- 予約カレンダー・決済・外部サービスへのアカウント登録
- 「car」「chauffeur」「transfer」など送迎を含むと読める語を使う
- 既存の `/ja` `/en` ページ・listing・taxonomy・`docs/design.md` を変えること
  （`/en` フッターの1行だけ例外）

## ルート構成

App Router の route group を使い、既存ページのレイアウトを一切継承しない。

| ファイル | URL |
|---|---|
| `app/(private)/private/layout.tsx` | 独自の `<html lang="en">` ルートレイアウト |
| `app/(private)/private/page.tsx` | `/private` ブランドのトップ（1画面） |
| `app/(private)/private/after-dark/page.tsx` | `/private/after-dark` 商品ページ |
| `app/(private)/private/request/page.tsx` | `/private/request` 問い合わせフォーム |
| `app/(private)/private/request/thanks/page.tsx` | `/private/request/thanks` 送信後（noindex） |

- 既存の `app/(site)/[lang]/...` のルーティングと衝突しない
- `/private` は英語のみ。`hreflang` は付けない
- sitemap には3ページ（`/private`、`/private/after-dark`、`/private/request`）を入れる。
  thanks は入れない（noindex）
- Play Miyazaki 側からの導線は、`/en` のフッターに小さく1行だけ
  「MIYAZAKI PRIVATE — a private evening in Miyazaki →」。`/ja` には出さない

## 見た目

- 暗い背景に文字だけ。写真・イラスト・アイコン・地図は使わない
- 配色

| 役割 | 値 |
|---|---|
| 背景 | `#0E0F12` |
| 文字 | `#EDE8DF` |
| 控えめな文字 | `#9A948A` |
| 罫線 | `#2A2C31` |
| アクセント（ボタンとリンクだけ） | `#C8A96A`（真鍮色） |

- フォント：見出し Cormorant Garamond（500/600）、本文 Inter（400/500）。
  `next/font/google`、`subsets: ['latin']`、`preload: false`。
  既存の Zen Kaku Gothic New / IBM Plex Mono は使わない
- 余白を大きく（セクション間 120px 以上）、1行の幅 640px 以内、
  本文 17px・行間 1.7
- 動きは使わない（reveal アニメーションも無し）
- CTA は真鍮色の枠線ボタン1種類だけ

## フォームの送信の仕組み

静的サイトなのでサーバーは無い。決済・アカウント作成もしない。

1. `NEXT_PUBLIC_REQUEST_FORM_ENDPOINT` があれば、その URL に POST するフォームを出す
2. 無くて `NEXT_PUBLIC_CONTACT_EMAIL` があれば、`mailto:` のボタンを出す
   （件名 `Request: MIYAZAKI AFTER DARK`、本文に項目のひな形）
3. どちらも無ければ「Requests open shortly.」の1行だけ出す（ビルドは通る）

- `.env.example` に2つの変数名を書き、値は空にする
- **メールアドレスそのものはコードにもリポジトリにも書かない**
- Vercel 側の環境変数は運営者が入れる。コード側からは触らない
- スパム対策として honeypot の隠し項目を1つ入れる（`company`）

## 文章

`/private`、`/private/after-dark`、`/private/request` の英文は、運営者から
渡されたものをそのまま使う。誤字の修正は可。**数字・時刻・価格は変えない。**
店名・人名・数字を勝手に足さない。

## 運営

MIYAZAKI PRIVATE is operated by Alpha Inc., Miyazaki.
体験の企画とホストを行う。宿泊・航空券・移動は客が手配する。
