export type Lang = "ja" | "en";

export const LANGS: Lang[] = ["ja", "en"];

export const SITE_URL = "https://playmiyazaki.com";

export const SITE_NAME = {
  ja: "Play Miyazaki",
  en: "Play Miyazaki",
};

export const SITE_TAGLINE = {
  ja: "宮崎で遊ぶための一覧サイト。サーフィン・キャンプ・食・ゴルフ。",
  en: "Directory for playing in Miyazaki: surfing, camping, food, and golf.",
};

export const HOME_TITLE = {
  ja: "Play Miyazaki — 宮崎で遊ぶための一覧サイト",
  en: "Play Miyazaki — Surf, camp, food and golf in Miyazaki",
};

export const NEARBY_HEADING = {
  ja: "同じエリアのスポット",
  en: "Also in this area",
};

export const UI = {
  home: { ja: "トップ", en: "Home" },
  filter_area: { ja: "エリアで絞る", en: "Filter by area" },
  filter_category: { ja: "種類で絞る", en: "Filter by category" },
  all: { ja: "すべて", en: "All" },
  spot_count: { ja: "件", en: "spots" },
  address: { ja: "住所", en: "Address" },
  phone: { ja: "電話", en: "Phone" },
  website: { ja: "公式サイト", en: "Website" },
  map: { ja: "Google マップで見る", en: "Open in Google Maps" },
  hours: { ja: "営業時間", en: "Hours" },
  price: { ja: "料金", en: "Price" },
  sources: { ja: "出典", en: "Sources" },
  verified_at: { ja: "確認日", en: "Verified" },
  status_closed: { ja: "閉業", en: "Closed" },
  status_unknown: { ja: "営業状況不明", en: "Status unknown" },
  check_official: { ja: "公式サイトで確認", en: "Check the official site" },
  switch_language: { ja: "English", en: "日本語" },
  breadcrumb_sep: { ja: " › ", en: " › " },
  no_listings: { ja: "該当するスポットはまだありません。", en: "No spots listed yet." },
  category_label: { ja: "種類", en: "Category" },
  area_label: { ja: "エリア", en: "Area" },
  spot_label: { ja: "スポット", en: "Spot" },
} as const;

export function otherLang(lang: Lang): Lang {
  return lang === "ja" ? "en" : "ja";
}

export function pick<T>(obj: { ja: T; en: T }, lang: Lang): T {
  return obj[lang];
}

export function pickNullable<T>(obj: { ja: T | null; en: T | null } | null, lang: Lang): T | null {
  if (!obj) return null;
  return obj[lang];
}
