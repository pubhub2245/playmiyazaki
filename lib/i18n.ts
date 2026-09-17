export type Lang = "ja" | "en" | "ko";

export const LANGS: Lang[] = ["ja", "en", "ko"];

export const SITE_URL = "https://playmiyazaki.com";

export const SITE_NAME = {
  ja: "Play Miyazaki",
  en: "Play Miyazaki",
  ko: "Play Miyazaki",
};

export const SITE_TAGLINE = {
  ja: "宮崎で遊ぶための一覧サイト。サーフィン・キャンプ・食・ゴルフ。",
  en: "Directory for playing in Miyazaki: surfing, camping, food, and golf.",
  ko: "미야자키에서 놀기 위한 종합 정보 사이트. 서핑 · 캠핑 · 음식 · 골프.",
};

export const HOME_TITLE = {
  ja: "Play Miyazaki｜宮崎で遊ぶための一覧サイト",
  en: "Play Miyazaki: Surf, camp, food and golf in Miyazaki",
  ko: "Play Miyazaki｜미야자키의 서핑·캠핑·음식·골프 정보",
};

export const NEARBY_HEADING = {
  ja: "同じエリアのスポット",
  en: "Also in this area",
  ko: "같은 지역의 스팟",
};

export const UI = {
  home: { ja: "トップ", en: "Home", ko: "홈" },
  filter_area: { ja: "エリアで絞る", en: "Filter by area", ko: "지역으로 필터" },
  filter_category: { ja: "種類で絞る", en: "Filter by category", ko: "종류로 필터" },
  all: { ja: "すべて", en: "All", ko: "전체" },
  spot_count: { ja: "件", en: "spots", ko: "곳" },
  address: { ja: "住所", en: "Address", ko: "주소" },
  phone: { ja: "電話", en: "Phone", ko: "전화" },
  website: { ja: "公式サイト", en: "Website", ko: "공식 사이트" },
  map: { ja: "Google マップで見る", en: "Open in Google Maps", ko: "구글 지도에서 보기" },
  hours: { ja: "営業時間", en: "Hours", ko: "영업시간" },
  price: { ja: "料金", en: "Price", ko: "요금" },
  sources: { ja: "出典", en: "Sources", ko: "출처" },
  verified_at: { ja: "確認日", en: "Verified", ko: "확인일" },
  status_closed: { ja: "閉業", en: "Closed", ko: "폐업" },
  status_unknown: { ja: "営業状況不明", en: "Status unknown", ko: "영업 여부 불명" },
  check_official: { ja: "公式サイトで確認", en: "Check the official site", ko: "공식 사이트에서 확인" },
  switch_language: { ja: "English", en: "日本語", ko: "한국어" },
  breadcrumb_sep: { ja: " › ", en: " › ", ko: " › " },
  no_listings: { ja: "該当するスポットはまだありません。", en: "No spots listed yet.", ko: "해당하는 스팟이 아직 없습니다." },
  category_label: { ja: "種類", en: "Category", ko: "종류" },
  area_label: { ja: "エリア", en: "Area", ko: "지역" },
  spot_label: { ja: "スポット", en: "Spot", ko: "스팟" },
} as const;

const LANG_ORDER: Lang[] = ["ja", "en", "ko"];

export function otherLang(lang: Lang): Lang {
  // Cycle through the available languages.
  const idx = LANG_ORDER.indexOf(lang);
  return LANG_ORDER[(idx + 1) % LANG_ORDER.length];
}

type Loc<T> = { ja: T; en: T; ko?: T };

export function pick<T>(obj: Loc<T>, lang: Lang): T {
  if (lang === "ko") return obj.ko ?? obj.en;
  return obj[lang];
}

export function pickNullable<T>(
  obj: { ja: T | null; en: T | null; ko?: T | null } | null,
  lang: Lang,
): T | null {
  if (!obj) return null;
  if (lang === "ko") return obj.ko ?? obj.en;
  return obj[lang];
}

export function pickHeading(
  entry: { heading_ja: string; heading_en: string; heading_ko?: string },
  lang: Lang,
): string {
  if (lang === "ja") return entry.heading_ja;
  if (lang === "ko") return entry.heading_ko ?? entry.heading_en;
  return entry.heading_en;
}

export function parseLang(v: string | undefined): Lang {
  return v === "en" ? "en" : v === "ko" ? "ko" : "ja";
}
