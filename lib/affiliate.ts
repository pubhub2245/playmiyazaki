/**
 * 紹介リンク（もしもアフィリエイト）。
 *
 * 決まり（CLAUDE.md・docs/要件.md）：
 * - 公式サイトと Google マップへのリンクは**絶対に紹介リンクにしない**。
 *   紹介リンクは「予約サイトへ送る」ボタンとして、別に1つ置くだけ。
 * - リンク先URLは出典があるものだけを書く。推測でURLを作らない。
 * - 評価語を使わない（「おすすめの宿」等と書かない）。
 *
 * 会員ID・プログラムIDは 2026-09-18 に じゅん が もしもアフィリエイトの
 * 管理画面から控えた値（司令室 pa23）。
 */

export type AffiliateProgram = {
  /** もしもの識別子。クリック用URLと計測画像で同じ値を使う */
  a_id: string;
  p_id: string;
  pc_id: string;
  pl_id: string;
  /** 送り先。出典のあるURLだけを書く */
  target: string;
};

/** 楽天トラベル（宮崎県の宿の一覧）。送り先URLは司令室 pa23 に書かれたもの */
export const RAKUTEN_TRAVEL: AffiliateProgram = {
  a_id: "5808511",
  p_id: "55",
  pc_id: "55",
  pl_id: "624",
  target: "https://travel.rakuten.co.jp/yado/miyazaki/",
};

/** クリック用のURLを組み立てる */
export function affiliateHref(p: AffiliateProgram): string {
  const q = new URLSearchParams({
    a_id: p.a_id,
    p_id: p.p_id,
    pc_id: p.pc_id,
    pl_id: p.pl_id,
    url: p.target,
  });
  return `https://af.moshimo.com/af/c/click?${q.toString()}`;
}

/** 表示回数の計測画像（1px）のURL。写真ではないので「写真を使わない」の決まりには当たらない */
export function affiliateImpressionSrc(p: AffiliateProgram): string {
  const q = new URLSearchParams({
    a_id: p.a_id,
    p_id: p.p_id,
    pc_id: p.pc_id,
    pl_id: p.pl_id,
  });
  return `https://i.moshimo.com/af/i/impression?${q.toString()}`;
}
