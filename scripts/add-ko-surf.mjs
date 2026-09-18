// One-shot: add ko fields to every surf listing JSON.
// Reads data/listings/surf/*.json, adds ko to name/address/hours/price/description,
// writes the file back. Idempotent: overwrites existing ko field if present.
//
// Same shape as scripts/add-ko-golf.mjs and scripts/add-ko-camp.mjs.
// Translations are inlined; no external API is used.
//
// Nothing new is invented here: every Korean string is a translation of the
// Japanese text already in the file. No facts are added.

import fs from "node:fs";
import path from "node:path";

const DIR = "data/listings/surf";

// City / town / gun labels for address.ko.
const CITY_KO = {
  "宮崎市": "미야자키시",
  "都城市": "미야코노조시",
  "延岡市": "노베오카시",
  "日南市": "니치난시",
  "小林市": "고바야시시",
  "日向市": "휴가시",
  "串間市": "구시마시",
  "西都市": "사이토시",
  "えびの市": "에비노시",
  "北諸県郡": "기타모로카타군",
  "西諸県郡": "니시모로카타군",
  "東諸県郡": "히가시모로카타군",
  "児湯郡": "고유군",
  "西臼杵郡": "니시우스키군",
  "東臼杵郡": "히가시우스키군",
  "三股町": "미마타초",
  "高原町": "다카하루초",
  "国富町": "구니토미초",
  "綾町": "아야초",
  "高鍋町": "다카나베초",
  "新富町": "신토미초",
  "西米良村": "니시메라손",
  "木城町": "기조초",
  "川南町": "가와미나미초",
  "都農町": "쓰노초",
  "門川町": "가도가와초",
  "諸塚村": "모로쓰카손",
  "椎葉村": "시이바손",
  "美郷町": "미사토초",
  "高千穂町": "다카치호초",
  "日之影町": "히노카게초",
  "五ヶ瀬町": "고카세초",
};

// Whole phrases that appear inside an address and are not a city label.
const ADDRESS_EXTRA = [
  ["（お倉ヶ浜近く）", "(오쿠라가하마 근처)"],
  ["ANAホリデイ・イン・リゾート宮崎アクティビティセンター内", "ANA 홀리데이 인 리조트 미야자키 액티비티 센터 내"],
  ["レジデンスエアポート", "레지던스 에어포트"],
  ["ハピネス田代", "하피네스 다시로"],
  ["梅ケ浜", "우메가하마"],
];

function applyRules(s, rules) {
  let out = s;
  for (const [a, b] of rules) out = out.replaceAll(a, b);
  return out;
}

// Convert a Japanese address into Korean by replacing the prefecture and known
// city/gun/town labels. Everything past the last known token (street number,
// sub-district) is kept as-is per the spec.
function addressKo(ja) {
  if (!ja) return null;
  let out = ja.replace("宮崎県", "미야자키현 ");
  // Replace longer keys before shorter to avoid partial hits.
  const keys = Object.keys(CITY_KO).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (out.includes(k)) out = out.replaceAll(k, CITY_KO[k] + " ");
  }
  out = applyRules(out, ADDRESS_EXTRA);
  return out.replace(/\s+/g, " ").trim();
}

// Translate a Japanese hours string to Korean. Times are kept as-is.
const HOURS_RULES = [
  ["水曜定休", "수요일 휴무"],
  ["木曜定休", "목요일 휴무"],
  ["年中無休", "연중무휴"],
  ["要予約", "예약 필요"],
  ["休み", "휴무"],
  ["（", "("],
  ["）", ")"],
  ["、", ", "],
];

function hoursKo(ja) {
  if (!ja) return null;
  return applyRules(ja, HOURS_RULES).replace(/\s+/g, " ").trim();
}

// Translate a Japanese price string to Korean. Numbers are kept as-is; only
// Japanese unit words and price nouns are swapped.
// ★ Order matters: longer phrases must come before the short words they contain.
const PRICE_RULES = [
  // ---- facilities -------------------------------------------------
  ["温水・冷水シャワーあり", "온수·냉수 샤워 있음"],
  ["冷水シャワー無料", "냉수 샤워 무료"],
  ["温水シャワー無料", "온수 샤워 무료"],
  ["シャワー無料", "샤워 무료"],
  ["温水シャワー", "온수 샤워"],
  ["冷水シャワー", "냉수 샤워"],
  ["コインロッカー", "코인 로커"],
  ["シャワー", "샤워"],
  ["駐車場", "주차장"],
  ["施設利用のみ", "시설 이용만"],
  // ---- programs ---------------------------------------------------
  ["体験スクール", "체험 스쿨"],
  ["レベルアップスクール", "레벨업 스쿨"],
  ["スクール", "스쿨"],
  ["ソフトボードレンタル", "소프트보드 렌탈"],
  ["ボードレンタル", "보드 렌탈"],
  ["ウェットスーツ", "웨트슈트"],
  ["ガイド・レンタル", "가이드·렌탈"],
  ["ガイド", "가이드"],
  ["2泊3日レンタルパック", "2박 3일 렌탈 패키지"],
  ["レンタルパック", "렌탈 패키지"],
  ["レンタル込", "렌탈 포함"],
  ["別途レンタル料", "별도 렌탈 요금"],
  ["レンタル料", "렌탈 요금"],
  ["レンタル", "렌탈"],
  ["フォイル", "포일"],
  ["1日フリーパス", "1일 자유이용권"],
  ["1プログラム", "1프로그램"],
  ["月額会員", "월 회원"],
  // ---- stays ------------------------------------------------------
  ["1名利用", "1인 이용"],
  ["1棟貸切", "1채 대절"],
  ["通常期", "일반 시즌"],
  ["ハイシーズン", "성수기"],
  // ---- vehicles ---------------------------------------------------
  ["軽バン", "경형 밴"],
  ["ミドルバン", "미들 밴"],
  // ---- tax / extras -----------------------------------------------
  ["（税込）", "(부가세 포함)"],
  ["（税別）", "(부가세 별도)"],
  ["税込", "부가세 포함"],
  ["税別", "부가세 별도"],
  ["別途", "별도"],
  ["無料", "무료"],
  ["あり", "있음"],
  // ---- units ------------------------------------------------------
  ["2泊3日", "2박3일"],
  ["1泊2日", "1박2일"],
  ["1泊", "1박"],
  ["／12時間", "／12시간"],
  ["12時間", "12시간"],
  ["時間", "시간"],
  ["／1日", "／1일"],
  ["/1日", "/1일"],
  ["／日", "／1일"],
  ["/日", "/1일"],
  ["1日", "1일"],
  ["1人", "1인"],
  ["1名", "1인"],
  ["大", "대 "],
  ["小", "소 "],
  ["円", "엔"],
  ["分", "분"],
  ["約", "약 "],
  ["、", ", "],
  ["・", "·"],
  ["（", "("],
  ["）", ")"],
];

function priceKo(ja) {
  if (!ja) return null;
  return (
    applyRules(ja, PRICE_RULES)
      // Japanese writes 「シャワー200円」with no space; Korean needs one.
      .replace(/([가-힣])(\d)/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim()
  );
}

// name / description: translated by hand, one entry per listing.
const MAP = {
  "aloha-rentacar": {
    name: "알로하 렌터카",
    description: "서퍼용 렌터카. 폴리탱크와 옷걸이 등 부속품은 무료.",
  },
  "ana-holiday-inn-resort-miyazaki": {
    name: "ANA 홀리데이 인 리조트 미야자키",
    description:
      "아오시마 해변에서 걸어갈 수 있는 리조트 호텔. 관내에 무라사키 스포츠 아오시마(구독형 서프 용품)가 있다.",
  },
  "aoshima": {
    name: "아오시마",
    description:
      "아오시마 신사와 이웃한 해안. 남쪽은 잔잔하고 북쪽은 기자키하마 방향으로 이어진다. 아오시마 비치 센터에 로커와 온수 샤워가 있다.",
  },
  "connect-journey": {
    name: "커넥트 저니",
    description: "프로 서퍼 아키모토 쇼헤이의 브랜드. 스쿨, 가이드, 렌탈을 다룬다.",
  },
  "connection-nobeoka": {
    name: "커넥션",
    description:
      "풀 커스텀 보드를 다루는 숍. BeMoLo 신발 취급. 초보자 체험과 코칭 있음. 목요일 휴무.",
  },
  "delight-surfing": {
    name: "딜라이트 서핑 서비스",
    description:
      "미야코노조시의 숍. 보드, 보디보드, 웨트슈트를 다루고 커스텀 보드 제작(히로타 서프보드 랩)도 한다.",
  },
  "ekolu-miyazaki": {
    name: "에콜루 미야자키 서프 가이드 & 렌터카",
    description:
      "전 JPSA 프로 미즈모토 고지가 운영. 공항 근처에서 서프 가이드와 서퍼용 렌터카를 다룬다.",
  },
  "first-trip": {
    name: "퍼스트 트립 서프 & 빈티지",
    description: "기자키하마에서 차로 약 5분 거리의 숍. 1대1 레슨과 렌탈 패키지를 다룬다.",
  },
  "freedom-nichinan": {
    name: "프리덤",
    description:
      "미야우라 해안을 중심으로 스쿨을 하는 숍. 수강생 3명당 강사 1명. 3일 전까지 예약.",
  },
  "gakky-surf-shop": {
    name: "가키 서프숍",
    description: "미야자키 공항에서 걸어서 3분 정도의 숍. 공항에서 무료 픽업 있음.",
  },
  "glance-surfboards": {
    name: "글랜스 서프보드",
    description: "보드 제작, 커스텀 에어브러시, 수리를 다루는 숍. 렌탈과 스쿨은 없다.",
  },
  "guest-house-goofy": {
    name: "게스트하우스 구피",
    description:
      "가네가하마에서 350m, 오쿠라가하마까지 차로 5분. 보드 스탠드, 웨트슈트 건조 랙, 야외 샤워 있음. 2019년 영업 시작.",
  },
  "high-surf": {
    name: "하이 서프",
    description: "가에다 지역의 숍. 스쿨과 SUP를 다룬다. 주차 20대.",
  },
  "himuka-kando-taiken": {
    name: "NPO법인 히무카 간도 다이켄 월드",
    description:
      "초보자용 롱보드부터 상급자용 숏보드까지 프로가 지도하는 서핑 체험. 노베오카시 기타가와초 거점.",
  },
  "ikurahama": {
    name: "이쿠라하마",
    description: "약 9km의 해안선. 서프 센터에 샤워와 로커가 있다.",
  },
  "isegahama": {
    name: "이세가하마",
    description: "일본의 해수욕장 100선에 선정된 해안. 무료 주차 82대.",
  },
  "kaguchihama": {
    name: "가구치하마",
    description: "비치 브레이크 해안. 가구치하마 해변공원 캠프장이 인접해 있다. 무료 주차 50대.",
  },
  "kanegahama": {
    name: "가네가하마",
    description: "국도 10호선 바로 옆에 있는 해안. 근처에 STAIRS OF THE SEA가 있다.",
  },
  "kazatahama": {
    name: "가자타하마",
    description:
      "대회가 열리는 해안. 바다거북의 산란지이기도 하다. 주차는 약 15대, 화장실은 근처에 없다.",
  },
  "kengoria-surf": {
    name: "켄고리아",
    description: "서프, SUP, 포일 레슨과 가이드를 다룬다. 영업 9:00〜18:00.",
  },
  "killer-surf-miyazaki": {
    name: "킬러 서프 미야자키",
    description:
      "JPSA 프로 가와바타 다이시가 운영하는 스쿨. 가이드, 렌탈, STAND 웨트슈트도 다룬다.",
  },
  "kizakihama": {
    name: "기자키하마",
    description:
      "미야자키시 남부의 롱 비치. 주차는 약 300대. 솔라시드에어 서핑 센터 기자키하마(2022년 4월 개설)에 샤워실·탈의실이 있다.",
  },
  "koigaura": {
    name: "고이가우라",
    description: "1년 내내 파도가 서는 포인트. 좌우 브레이크가 있다. 무료 주차는 3대뿐.",
  },
  "minshuku-kaiyo-so": {
    name: "민슈쿠 가이요소",
    description: "고이가우라가 있는 지역의 민박.",
  },
  "minshuku-kanegahama": {
    name: "민슈쿠 가네가하마",
    description:
      "가네가하마 바로 앞에 있는 민박. 보드 로커와 이 지역 생선을 쓴 저녁 식사가 있다.",
  },
  "minshuku-koigaura": {
    name: "민슈쿠 고이가우라",
    description:
      "고이가우라 바로 앞에 있는 민박. 식사 없이 숙박만. 기본적인 서프 용품 판매와 렌탈도 있다.",
  },
  "minshuku-misakisou": {
    name: "민슈쿠 미사키소",
    description:
      "고도모노쿠니 앞 서프 브레이크 바로 앞에 있는 민박. 할인 항공권이 포함된 서프 트립 패키지가 있다.",
  },
  "minshuku-ogon-so": {
    name: "민슈쿠 오곤소",
    description: "고이가우라가 있는 지역의 민박.",
  },
  "miyazaki-surf-guide": {
    name: "미야자키 서프 가이드",
    description:
      "초보자 체험, 레벨업 레슨, 프라이빗 서프 가이드, 보드·웨트슈트 렌탈을 다룬다. 온수 샤워, 탈의실, 타월 포함. 영어 대응 가능.",
  },
  "n-tribe": {
    name: "n'tribe(프리덤 내)",
    description: "프리덤 서프숍 안에 있는 로지. 8실, 최대 32명. 식사 없이 숙박만.",
  },
  "nagisa-store": {
    name: "나기사 스토어",
    description: "아오시마 해변에서 걸어서 30초 거리의 숍. 60개 이상의 보드를 다룬다. 수요일 휴무.",
  },
  "new-wave-surf": {
    name: "뉴 웨이브 서프 & 스케이트",
    description: "기자키하마 근처의 숍. 스쿨, 렌탈, 가이드 투어를 다룬다. JPBA 프로숍.",
  },
  "oceanside-okuragahama": {
    name: "오션사이드 오쿠라가하마 게스트하우스",
    description:
      "오쿠라가하마에서 걸어서 5분 거리의 컨테이너 하우스형 게스트하우스. 옆에 선라이즈 서프숍이 있다.",
  },
  "odotsu": {
    name: "오도쓰",
    description: "섬으로 둘러싸인 만이라서 파도가 비교적 잔잔하다. 초보자에게 맞는 포인트.",
  },
  "okuragahama": {
    name: "오쿠라가하마",
    description:
      "약 4km의 롱 비치. 2017년 ISA 월드 주니어 서핑 챔피언십 개최지. 마린 웨이브 비치하우스에 주차 305대(무료).",
  },
  "on-the-beach": {
    name: "온 더 비치",
    description:
      "1996년 창업. JPSA 프로 구보타 사토시가 운영하는 숍. 커스텀 보드·웨트슈트, 온라인 코칭 있음.",
  },
  "pleasant-hyuga": {
    name: "플레전트 휴가",
    description: "오쿠라가하마가 내려다보이는 숙소. 서퍼와 가족 여행객 대상.",
  },
  "pumping-surf": {
    name: "게스트하우스 Pumping Surf",
    description:
      "오쿠라가하마까지 걸어서 3분. 무료 자전거, BBQ, 미나미휴가역에서 무료 픽업 있음.",
  },
  "quest-surf": {
    name: "퀘스트",
    description:
      "미나미미야자키역에서 약 300m 거리의 숍. Firewire, Tokoro를 다룬다. 수리, 렌탈, 스쿨 있음.",
  },
  "rum-jungle": {
    name: "럼 정글 서프숍",
    description: "히토쓰바 지역의 오래된 숍. 스쿨, 렌탈, 가이드 투어를 다룬다.",
  },
  "sea-dweller-aoshima": {
    name: "SEA-DWELLER 아오시마",
    description: "아오시마의 숙소. 기자키하마 서프 포인트를 액티비티로 소개하고 있다.",
  },
  "see-u-surf": {
    name: "시 유 서프숍",
    description:
      "아오시마 해변에서 걸어서 약 1분 거리의 숍. JPSA 프로 우메노 고세이가 운영한다.",
  },
  "sunrise-surfshop": {
    name: "선라이즈 서프숍",
    description:
      "오쿠라가하마 바로 옆. 게스트하우스 오션사이드 오쿠라가하마(2024년 3월 개업)와 인접해 있다.",
  },
  "surf-city-miyazaki": {
    name: "서프 시티 미야자키",
    description:
      "아오시마 해변공원에 인접. 서프, SUP, 요가, 키즈 방과후 서프를 다룬다. asoview에서 예약 가능.",
  },
  "surf3": {
    name: "서프3",
    description:
      "기자키하마 근처의 숍. 매장 안에 웨트슈트 공장을 함께 두고 있다. 브랜드를 가리지 않고 수리를 받는다. 목요일 휴무.",
  },
  "surfguide-himawari": {
    name: "서프 가이드 HIMAWARI",
    description: "하루 한 팀만 받는 스쿨. 보드 로커, 렌탈 있음. 예약 필요.",
  },
  "swell-guesthouse-cafe": {
    name: "SWELL Guesthouse & Cafe",
    description: "게스트하우스에 함께 있는 카페. 야외 샤워 있음.",
  },
  "total-coordinate": {
    name: "토탈 코디네이트",
    description:
      "서핑 지도 25년 경력의 가이드가 있다. 서프, SUP, SUP 요가, 요가, 코어 트레이닝을 다룬다. 미야자키역에서 픽업 있음. 주차 7대.",
  },
  "trip-rentacar-miyazaki": {
    name: "SURF & TURF 트립 렌터카 미야자키",
    description:
      "미야자키 공항 픽업이 포함된 렌터카. 서프보드 렌탈 포함. 서프 트립에 맞는 차 크기.",
  },
  "umegahama": {
    name: "우메가하마",
    description:
      "라이온 바위를 기준으로 하는 상급자용 브레이크. 근처에 히로토가와 하구 포인트도 있다.",
  },
};

let touched = 0;
const missing = [];

for (const f of fs.readdirSync(DIR).sort()) {
  const fp = path.join(DIR, f);
  const j = JSON.parse(fs.readFileSync(fp, "utf8"));
  const m = MAP[j.slug];
  if (!m) {
    missing.push(j.slug);
    continue;
  }

  if (j.name) j.name.ko = m.name;
  if (j.address) j.address.ko = addressKo(j.address.ja);
  if (j.hours) j.hours.ko = hoursKo(j.hours.ja);
  if (j.price) j.price.ko = priceKo(j.price.ja);
  if (j.description) j.description.ko = m.description;

  fs.writeFileSync(fp, JSON.stringify(j, null, 2) + "\n", "utf8");
  touched += 1;
}

console.log(`ko fields added to ${touched} surf listing(s).`);
if (missing.length) {
  console.log(`Missing translations for slugs: ${missing.join(", ")}`);
}
