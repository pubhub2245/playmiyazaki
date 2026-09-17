import { loadAllListings } from "./data";
import { LANGS } from "./i18n";
import {
  absolute,
  urlArea,
  urlCategory,
  urlFeature,
  urlGenre,
  urlHome,
  urlListing,
} from "./url";
import {
  areasWithListings,
  categoriesWithListings,
  featuresWithListings,
  genresWithListings,
} from "./coverage";

/**
 * IndexNow = 更新したURLを検索エンジン側に「こちらから」知らせる仕組み。
 * Bing / DuckDuckGo などが対応（Google は非対応）。無料・アカウント不要・鍵は公開前提。
 *
 * 鍵は秘密ではない。`public/<鍵>.txt` に同じ文字列を置いて、
 * 「このサイトの持ち主が送っている」ことを示すだけのもの。
 * 変えるときは public 配下のファイル名と中身も必ず一緒に変える。
 */
export const INDEXNOW_KEY = "6d342d605825c8df006e797e5deed1de";

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** 1回で送る上限。IndexNow の仕様は1万件だが、無駄に大きく送らない */
export const INDEXNOW_MAX = 2000;

/** ジャンル・エリア・種別・特徴・トップなど、一覧側のURL（listing を足すと中身が変わる） */
export function sectionUrls(): string[] {
  const urls: string[] = [];
  for (const lang of LANGS) {
    urls.push(absolute(urlHome(lang)));
    for (const g of genresWithListings()) {
      urls.push(absolute(urlGenre(lang, g)));
      for (const c of categoriesWithListings(g)) urls.push(absolute(urlCategory(lang, g, c)));
      for (const a of areasWithListings(g)) urls.push(absolute(urlArea(lang, g, a)));
      for (const f of featuresWithListings(g)) urls.push(absolute(urlFeature(lang, g, f)));
    }
  }
  return urls;
}

/** スポット1件ごとの詳細ページ（日英韓） */
export function listingUrls(filter?: (verifiedAt: string) => boolean): string[] {
  const urls: string[] = [];
  for (const l of loadAllListings()) {
    if (filter && !filter(l.verified_at)) continue;
    for (const lang of LANGS) urls.push(absolute(urlListing(lang, l.genre, l.slug)));
  }
  return urls;
}

/** 指定したスポット（genre/slug）の詳細ページURL（日英韓） */
export function urlsForListings(keys: Array<{ genre: string; slug: string }>): string[] {
  const urls: string[] = [];
  for (const k of keys) {
    for (const lang of LANGS) urls.push(absolute(urlListing(lang, k.genre, k.slug)));
  }
  return urls;
}

/**
 * 送るURLを決める。
 * ・all … 全部（最初の1回・作り直したときだけ）
 * ・changed を渡したとき … そのスポットの詳細ページ ＋ 一覧側
 * ・どちらも無いとき … 直近 days 日以内に出典を確認し直したスポット ＋ 一覧側
 *
 * 変わっていないURLを毎回送り続けても意味が無いので、既定はいつも「変わった分だけ」。
 */
export function urlsToSubmit(
  opts: { all?: boolean; changed?: Array<{ genre: string; slug: string }>; days?: number; now?: Date } = {},
): string[] {
  const seen = new Set<string>();
  const push = (u: string) => seen.add(u);

  if (opts.all) {
    for (const u of sectionUrls()) push(u);
    for (const u of listingUrls()) push(u);
    return [...seen].slice(0, INDEXNOW_MAX);
  }

  let fresh: string[];
  if (opts.changed) {
    if (opts.changed.length === 0) return [];
    fresh = urlsForListings(opts.changed);
  } else {
    const days = opts.days ?? 7;
    const now = opts.now ?? new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    fresh = listingUrls((verifiedAt) => {
      const d = new Date(verifiedAt);
      return !Number.isNaN(d.getTime()) && d >= since;
    });
    if (fresh.length === 0) return [];
  }

  for (const u of sectionUrls()) push(u);
  for (const u of fresh) push(u);
  return [...seen].slice(0, INDEXNOW_MAX);
}
