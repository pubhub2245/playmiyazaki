// One-shot: add ko fields to every golf listing JSON.
// Reads data/listings/golf/*.json, adds ko to name/address/price/description,
// writes the file back. Idempotent: overwrites existing ko field if present.
//
// Translations are inlined; no external API is used.

import fs from "node:fs";
import path from "node:path";

const DIR = "data/listings/golf";

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
  // Collapse repeated spaces.
  return out.replace(/\s+/g, " ").trim();
}

// Translate a Japanese price string to Korean. Numbers are kept as-is; only
// Japanese unit words and price nouns are swapped.
function priceKo(ja) {
  if (!ja) return null;
  let s = ja;
  const rules = [
    ["セルフ4B", "셀프 4B"],
    ["セルフ", "셀프"],
    ["総額", "총액"],
    ["食事・カート込", "식사·카트 포함"],
    ["食事", "식사"],
    ["食堂", "식당"],
    ["1F・2F", "1F·2F"],
    ["深夜営業", "심야 영업"],
    ["営業", "영업"],
    ["メンバー", "회원"],
    ["1組4名・お一人様", "1팀 4명·1인"],
    ["1組", "1팀"],
    ["お一人様", "1인"],
    ["3,300円／セット", "3,300엔／세트"],
    ["・", "·"],
    ["キャディ付", "캐디 포함"],
    ["キャディ", "캐디"],
    ["キャディフィー", "캐디피"],
    ["グリーンフィー", "그린피"],
    ["ゴルフ利用税", "골프 이용세"],
    ["ゴルフ場利用税", "골프장 이용세"],
    ["消費税", "부가세"],
    ["税込", "부가세 포함"],
    ["税別", "부가세 별도"],
    ["込み", "포함"],
    ["込", "포함"],
    ["別途", "별도"],
    ["別", "별도"],
    ["昼食補助付", "점심 보조 포함"],
    ["昼食補助", "점심 보조"],
    ["昼食", "점심"],
    ["朝食付", "조식 포함"],
    ["朝食", "조식"],
    ["夕食", "석식"],
    ["2食付", "2식 포함"],
    ["1泊", "1박"],
    ["1本", "1개"],
    ["1組", "1팀"],
    ["1セット", "1세트"],
    ["1球", "1볼"],
    ["1時間", "1시간"],
    ["1回", "1회"],
    ["月2回", "월 2회"],
    ["1F・2F共通", "1F·2F 공통"],
    ["1F", "1F"],
    ["2F", "2F"],
    ["メンバー", "회원"],
    ["ビジター", "비지터"],
    ["レギュラー会員", "레귤러 회원"],
    ["シルバー会員", "실버 회원"],
    ["ゴールド会員", "골드 회원"],
    ["シニア会員", "시니어 회원"],
    ["月額会員", "월 회원"],
    ["月額", "월"],
    ["月会費", "월회비"],
    ["月", "월"],
    ["入会金", "입회비"],
    ["入場料", "입장료"],
    ["延長チケット", "연장 티켓"],
    ["延長", "연장"],
    ["ボール代", "볼 요금"],
    ["打席料", "타석 요금"],
    ["ラウンドシミュレーター", "라운드 시뮬레이터"],
    ["シミュレーター", "시뮬레이터"],
    ["レンタルクラブ 一式", "렌탈 클럽 세트"],
    ["レンタルクラブ", "렌탈 클럽"],
    ["貸クラブ 一式", "클럽 대여 세트"],
    ["貸クラブ一式", "클럽 대여 세트"],
    ["貸クラブ", "클럽 대여"],
    ["貸し", "대여"],
    ["貸", "대여"],
    ["クラブレンタル", "클럽 렌탈"],
    ["クラブ", "클럽"],
    ["シューズ", "슈즈"],
    ["パター", "퍼터"],
    ["バンカー", "벙커"],
    ["アプローチ", "어프로치"],
    ["ボール", "볼"],
    ["セット", "세트"],
    ["ティーチング料", "레슨 요금"],
    ["ラウンド", "라운드"],
    ["ホール", "홀"],
    ["9H", "9홀"],
    ["18H", "18홀"],
    ["27H", "27홀"],
    ["9ホール", "9홀"],
    ["18ホール", "18홀"],
    ["ショートコース", "쇼트 코스"],
    ["コース", "코스"],
    ["カート付", "카트 포함"],
    ["カート", "카트"],
    ["ナビ付4人乗りカート", "내비 포함 4인승 카트"],
    ["4人乗り", "4인승"],
    ["1泊朝食付", "1박 조식 포함"],
    ["1泊2食付", "1박 2식 포함"],
    ["岩盤浴", "암반욕"],
    ["バイキング", "뷔페"],
    ["ゴルフ宿泊パック", "골프 숙박 패키지"],
    ["宿泊のみ", "숙박만"],
    ["宿泊税", "숙박세"],
    ["九州在住者限定", "규슈 거주자 한정"],
    ["2サム割増", "2인 플레이 할증"],
    ["ドリンクバー付", "드링크바 포함"],
    ["ドリンクバー", "드링크바"],
    ["薄暮プレー", "박모(late) 플레이"],
    ["薄暮ゴルフ", "박모 골프"],
    ["日帰り", "당일"],
    ["宿泊+平日1プレー", "숙박+평일 1플레이"],
    ["宿泊", "숙박"],
    ["平日限定", "평일 한정"],
    ["平日", "평일"],
    ["土日祝", "주말·공휴일"],
    ["土日", "주말"],
    ["祝", "공휴일"],
    ["全日", "전일"],
    ["全打席", "전 타석"],
    ["打席", "타석"],
    ["ヤード", "야드"],
    ["パー", "파"],
    ["円", "엔"],
    ["一般", "일반"],
    ["大人", "대인"],
    ["小人", "소인"],
    ["男性", "남성"],
    ["女性", "여성"],
    ["会員", "회원"],
    ["入会", "입회"],
    ["球", "볼"],
    ["本", "개"],
    ["名", "명"],
    ["人泊", "인·박"],
    ["人", "인"],
    ["時", "시"],
    ["分", "분"],
    ["日", "일"],
    ["週1回", "주 1회"],
    ["週2回", "주 2회"],
    ["無料", "무료"],
  ];
  const extra = [
    ["あり", "있음"],
    ["なし", "없음"],
    ["以上", "이상"],
    ["以下", "이하"],
    ["まで", "까지"],
    ["、", ", "],
    ["。", ". "],
    ["（", " ("],
    ["）", ") "],
    ["／", " / "],
    ["〜", "~"],
  ];
  const all = [...rules, ...extra].sort((a, b) => b[0].length - a[0].length);
  for (const [a, b] of all) s = s.replaceAll(a, b);
  s = s.replace(/  +/g, " ");
  return s;
}

// Manually curated per-slug translations: name.ko and description.ko.
// Names use "original + hangul reading" style per spec; description is a
// concise natural Korean rewrite of the en description, facts only, <=160 chars.
const MAP = {
  "aiwa-miyazaki-gc": {
    name: "아이와 미야자키 골프 클럽",
    description: "사도와라의 18홀·7,093야드·파72 코스. 발코니 딸린 객실의 호텔 병설. 셀프 또는 캐디 선택 가능.",
  },
  "aiwa-miyazaki-resort-hotel": {
    name: "아이와 미야자키 리조트 호텔",
    description: "골프장 병설 호텔. 트윈룸 전 객실 발코니.",
  },
  "aoshima-gc": {
    name: "아오시마 골프 클럽",
    description: "아오시마 인근의 18홀 코스. 어코디아 골프 운영. 클럽 렌탈, 연습장·스쿨, 레스토랑, 온라인 예약 가능.",
  },
  "asahigaoka-golf-resort": {
    name: "아사히가오카 골프 리조트",
    description: "미마타의 250야드 연습장. LED 조명으로 야간 가능. 쇼트 코스 병설, 클럽 렌탈 및 레슨 있음.",
  },
  "aya-golf-studio": {
    name: "AYA 골프 스튜디오",
    description: "노베오카의 인도어 골프 스튜디오. 개인 시뮬레이터룸. 스튜디오·연습장·코스 레슨. 회원제.",
  },
  "cherry-golf-kitakata": {
    name: "체리 골프 기타카타 코스",
    description: "노베오카 기타카타초의 18홀 코스. 체리 골프 그룹 운영. 레스토랑, 온라인 예약 가능.",
  },
  "cherry-golf-nobeoka": {
    name: "체리 골프 노베오카 코스",
    description: "노베오카 우라시로초의 골프장. 체리 골프 그룹 운영. 레스토랑, 온라인 예약 가능.",
  },
  "fir-tree-cc": {
    name: "퍼 트리 컨트리 클럽",
    description: "노베오카 시모이가타초의 300야드·72타석 연습장. 9홀 쇼트 코스 병설, 야간 조명 무료, 왼손 타석 있음.",
  },
  "golf-partner-miyakonojo-range": {
    name: "골프 파트너 미야코노조 연습장점",
    description: "미야코노조 와카바초의 연습장. 조명 있음. 숍·시타실·탄도 측정·공방 병설. 레슨 가능.",
  },
  "golf72-nichinan": {
    name: "Golf72",
    description: "니치난 난고초의 인도어 연습장. 완전 개인실에서 버추얼 골프 100코스.",
  },
  "grass-garden-shioji": {
    name: "그라스 가든 시오지",
    description: "미야자키시 시오지의 220야드·64타석 연습장. 조명 무료. 평일은 심야 영업.",
  },
  "gst-golf-studio-takayama": {
    name: "GST 골프 스튜디오 다카야마",
    description: "다카나베초의 전천후 실내 연습장. GOLFZON 시뮬레이터에 240개 이상의 코스. 레슨과 클럽 공방 있음.",
  },
  "hello-golf": {
    name: "HELLO GOLF",
    description: "미야자키 중심부의 인도어 연습장. 전 타석 탄도 측정. 벙커·어프로치·퍼팅 연습 공간 있음.",
  },
  "hibiscus-gc": {
    name: "히비스커스 골프 클럽",
    description: "사도와라의 18홀·파72·6,920야드. 레스토랑 있음. 온라인 예약 가능.",
  },
  "hitotsuse-kenmin-golf": {
    name: "히토쓰세가와 현민 골프장",
    description: "신토미초의 현립 18홀 파70·5,710야드 코스. 클럽·슈즈 대여, 연습장과 어프로치 연습장 있음.",
  },
  "hontani-green-golf": {
    name: "혼타니 그린 골프",
    description: "휴가시 톤다카의 200야드·35타석 연습장. 주차 30대.",
  },
  "hotel-aoshima-cinqmale": {
    name: "호텔 아오시마 상크말",
    description: "아오시마의 숙소. 미야자키 컨트리 클럽 18홀 플레이(그린피·캐디피 포함)와 숙박이 결합된 골프 패키지. 4명 1팀, 전화 예약만 가능.",
  },
  "hotel-nichinan-kitago-resort": {
    name: "호텔 니치난 기타고 리조트",
    description: "니치난 기타고 컨트리 클럽 병설 호텔. 숙박 골프 패키지와 당일 플랜. 전망 노천탕과 암반욕, 뷔페 레스토랑.",
  },
  "ichigaoka-golf-garden": {
    name: "이치가오카 골프 가든",
    description: "노베오카 시모이가타의 200야드·60타석 연습장. 야간 조명 있음. 월·목·토에 레슨.",
  },
  "ikeuchi-golf": {
    name: "이케우치 골프",
    description: "미야자키시 이케우치초의 연습장. 레슨 있음.",
  },
  "indoor-golf-club-kyushu-aoba": {
    name: "인도어 골프 클럽 규슈 아오바점",
    description: "미야자키시 아오바초의 인도어 연습장. 시뮬레이터와 퍼팅 공간. 회원제, 무료 체험 가능.",
  },
  "indoor-golf-club-kyushu-fukushima": {
    name: "인도어 골프 클럽 규슈 후쿠시마초점",
    description: "미야자키시 후쿠시마초의 인도어 연습장. 시뮬레이터와 퍼팅 공간. 회원제, 월 2회 그룹 레슨.",
  },
  "inthegolf-aeon-miyazaki": {
    name: "인더골프 이온몰 미야자키점",
    description: "이온몰 미야자키 2층의 인도어 연습장. 시뮬레이터 6타석, 레슨 포함 월회비제, 클럽 대여 무료.",
  },
  "k-golf-saito": {
    name: "K-golf",
    description: "사이토시 쓰마의 24시간 인도어 연습장. 시뮬레이터, 클럽 대여 무료, 입회비 없는 시간제.",
  },
  "kaorusaka-golf": {
    name: "가오루자카 골프 연습장",
    description: "미야자키시 후루조초의 200야드·76타석 연습장. 조명 무료.",
  },
  "kobayashi-cc-cottage": {
    name: "미야자키 고바야시 컨트리 클럽 코티지",
    description: "골프장 부지 내의 코티지 18동. 1동 4인. 1박+1라운드(점심 포함) 패키지와 숙박만 플랜. 조식 포함.",
  },
  "kosei-golf-arena": {
    name: "고세이 골프 아레나",
    description: "미야자키시 혼고키타카타의 210야드·144타석 연습장. 클럽 대여 없음.",
  },
  "kushima-golf-garden": {
    name: "구시마 골프 가든",
    description: "구시마시의 200야드·20타석 연습장.",
  },
  "lien-golf-club": {
    name: "리앙 골프 클럽",
    description: "미야코노조의 11타석 연습장. GDR·VISION 등 시뮬레이터. 프로 레슨, 회원제.",
  },
  "lit-golf": {
    name: "LIT GOLF",
    description: "미야자키시 에히라히가시의 인도어 연습장. TRACKMAN 4타석 (왼손 타석 포함), 클럽 대여, 숍과 공방 병설.",
  },
  "mimitsu-cc": {
    name: "미미쓰 컨트리 클럽",
    description: "휴가시 도고초의 골프장. 레스토랑 있음. 외부 예약 시스템으로 예약 가능.",
  },
  "miyakonojo-sports-garden": {
    name: "미야코노조 스포츠 가든",
    description: "미야코노조 와카바초의 150야드·51타석 연습장. 야간은 평일 22시·주말 21시까지. 레슨 있음.",
  },
  "miyazaki-airport-cc-lodge": {
    name: "미야자키 국제 공항 컨트리 클럽 로지",
    description: "골프장 병설 로지. 1박 조식·중식 포함 골프 패키지. 레스토랑·욕실·연회장 있음.",
  },
  "miyazaki-airport-cc": {
    name: "미야자키 국제 공항 컨트리 클럽",
    description: "다노초의 18홀 코스. 숙박 로지 병설, 1박 조식·중식 포함 골프 패키지. 레스토랑과 연회장 있음.",
  },
  "miyazaki-airport-golf-center": {
    name: "미야자키 공항 골프 센터",
    description: "미야자키시 아카에의 연습장. 입장료 방식. 초보자·일반·주니어 골프 스쿨 있음.",
  },
  "miyazaki-cc": {
    name: "미야자키 컨트리 클럽",
    description: "미야자키시 다요시의 18홀 코스. 1960년 개장. JLPGA 투어 챔피언십 리코컵 개최 코스.",
  },
  "miyazaki-golf-club": {
    name: "미야자키 골프 클럽",
    description: "구니토미초의 18홀·파72·6,648야드. 1973년 개장. 연습장 있음. 신용카드 사용 가능.",
  },
  "miyazaki-kobayashi-cc": {
    name: "미야자키 고바야시 컨트리 클럽",
    description: "고바야시시의 18홀 코스. 부지 내 코티지 18동. 1박+1라운드 골프 패키지. 24시간 온라인 예약 가능.",
  },
  "miyazaki-kokusai-gc": {
    name: "미야자키 고쿠사이 골프 클럽",
    description: "사도와라의 27홀 코스 (다치바나·기리시마·오즈즈). PGM 운영. 레스토랑, 온라인 예약 가능.",
  },
  "miyazaki-lakeside-gc": {
    name: "미야자키 레이크사이드 골프 클럽",
    description: "기요타케초의 18홀 코스. 연습장, 레스토랑과 컴프룸, 프로숍·로커·욕실 있음.",
  },
  "miyazaki-ohyodo-cc": {
    name: "미야자키 오요도 컨트리 클럽",
    description: "미야자키시 나가미네의 18홀 코스. 레스토랑 있음. 온라인 예약 가능.",
  },
  "miyazaki-public-golf": {
    name: "미야자키 퍼블릭 골프",
    description: "다요시의 9홀 퍼블릭 코스. 5일 전까지 온라인 예약 가능. 식당 있음.",
  },
  "miyazaki-sunshine-cc": {
    name: "미야자키 선샤인 컨트리 클럽",
    description: "사도와라의 18홀 코스. 박모 골프와 9홀 플레이. 클럽 대여, 레스토랑, 테이크아웃 있음.",
  },
  "mochio-cc": {
    name: "미야코노조 모치오 컨트리 클럽",
    description: "미야코노조 세키노오초의 18홀 (세키노오 아웃·모치 인). 셀프 플레이와 승용 카트. 클럽 대여와 식당 있음.",
  },
  "nichinan-kitago-cc": {
    name: "니치난 기타고 컨트리 클럽",
    description: "기타고의 18홀·7,012야드·파72. 호텔 병설, 숙박 골프 패키지와 당일 플랜. 온천과 레스토랑 있음.",
  },
  "nichinan-kushima-golf-course": {
    name: "니치난 구시마 골프 코스",
    description: "구시마시 혼조의 18홀·파72. 세이부 프린스 호텔즈 운영. 레스토랑, 티타임 검색과 예약 가능.",
  },
  "noa-golf-studio": {
    name: "NOA 골프 스튜디오",
    description: "미야자키시의 인도어 연습장. 투어 공식 시뮬레이터, AI 스윙 진단, 전용 앱.",
  },
  "nomura-golf": {
    name: "노무라 골프 연습장",
    description: "사도와라의 22타석 (1층 16·2층 6) 연습장. 클럽 대여 무료. 초보부터 경기자용 레슨.",
  },
  "ohyodogawa-golf": {
    name: "오요도가와 골프장",
    description: "미야자키시 아토에의 9홀 코스. 티 위치를 바꿔 2바퀴. 전 홀 100야드의 쇼트 코스도 있음.",
  },
  "p-one-under": {
    name: "P-One Under 인도어 골프 베이스",
    description: "미야자키시 다치바나도리히가시의 인도어 연습장. 탄도 측정과 1000fps 카메라. 프로 레슨. 장비 대여 없음.",
  },
  "phoenix-cc": {
    name: "피닉스 컨트리 클럽",
    description: "시가이아 리조트 내 27홀 코스. 숙박 플랜, 레스토랑과 컴프룸, 350야드 연습장의 아카데미 병설.",
  },
  "rainbow-sports-land-gc": {
    name: "레인보 스포츠 랜드 골프 클럽",
    description: "미야코노조 다카조초의 18홀 코스. 어코디아 골프 운영. 클럽 렌탈과 레스토랑, 온라인 예약 가능.",
  },
  "regent-miyazaki-cc": {
    name: "리젠트 미야자키 컨트리 클럽",
    description: "미야코노조 야마다초의 골프장. 레스토랑 있음. 온라인 예약 가능.",
  },
  "sankyo-golf-center": {
    name: "산쿄 골프 센터",
    description: "니치난시 구마타니의 200야드·23타석 연습장. 조명 무료. 퍼팅·벙커·어프로치 연습장 있음.",
  },
  "seagaia-forest-condominium": {
    name: "시가이아 포레스트 콘도미니엄",
    description: "시가이아 리조트 내 콘도미니엄. 피닉스 CC·톰 왓슨 GC 숙박 골프 플랜의 대상 시설.",
  },
  "seagaia-forest-cottage": {
    name: "시가이아 포레스트 코티지",
    description: "시가이아 리조트 내 코티지. 피닉스 CC·톰 왓슨 GC 숙박 골프 플랜의 대상 시설.",
  },
  "seagaia-ocean-tower": {
    name: "피닉스 시가이아 오션 타워",
    description: "시가이아 리조트 내 호텔. 피닉스 CC·톰 왓슨 GC 숙박 골프 플랜 대상. 리조트 내 연습장과 아카데미.",
  },
  "shintomi-sports-land": {
    name: "신토미 스포츠 랜드",
    description: "신토미초의 골프 연습장. 파크 골프·테니스·배팅·탁구도 병설.",
  },
  "sunace-golf-center": {
    name: "선에이스 골프 센터",
    description: "휴가시 톤다카의 260야드·40타석 연습장. 클럽 렌탈 가능.",
  },
  "sunpower-golf": {
    name: "선파워 골프",
    description: "미야코노조 시모나가에의 200야드·60타석 연습장.",
  },
  "takaharu-gc": {
    name: "다카하루 골프 클럽",
    description: "다카하루초의 9홀·파36 코스. 소프트 스파이크 전용.",
  },
  "takanabe-golf-sports-center": {
    name: "다카나베 골프 스포츠 센터",
    description: "다카나베초 우와에의 250야드·68타석 연습장. 주차 70대.",
  },
  "takaoka-golf-center": {
    name: "다카오카 골프 센터",
    description: "미야자키시 다카오카초의 200야드·68타석 연습장. 조명 무료, 클럽 렌탈 있음.",
  },
  "tokai-golf-arena": {
    name: "도카이 골프 아레나",
    description: "노베오카 마키마치의 160야드·53타석 연습장. 무제한 타격 옵션, 쇼트 코스, 벙커·어프로치·퍼팅 연습장, 공방 병설.",
  },
  "tom-watson-golf-course": {
    name: "톰 왓슨 골프 코스",
    description: "시가이아 리조트 내 18홀 코스. 야간 영업. 리조트 내 숙박과 레스토랑. 영어 표시와 온라인 예약 있음.",
  },
  "tsuno-green-golf-center": {
    name: "쓰노 그린 골프 센터",
    description: "쓰노초의 250야드·22타석 연습장. 퍼팅·벙커 연습장 있음.",
  },
  "umk-cc": {
    name: "UMK 컨트리 클럽",
    description: "미야자키시 니이나즈메의 18홀 코스. AXA 레이디스 개최 코스. 연습장, 레스토랑, 온라인 예약 가능.",
  },
  "zaronbai-gc": {
    name: "미야자키 자론바이 골프 클럽",
    description: "신토미초 뉴타의 18홀·파72. 클럽 렌탈과 레스토랑 있음. 연습장은 대회 시에만 개방.",
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

  if (j.name && !j.name.ko) j.name.ko = m.name;
  else if (j.name) j.name.ko = m.name; // overwrite for consistency

  if (j.address) j.address.ko = addressKo(j.address.ja);

  if (j.price) j.price.ko = priceKo(j.price.ja);

  if (j.description) j.description.ko = m.description;

  fs.writeFileSync(fp, JSON.stringify(j, null, 2) + "\n", "utf8");
  touched += 1;
}

console.log(`ko fields added to ${touched} golf listing(s).`);
if (missing.length) {
  console.log(`Missing translations for slugs: ${missing.join(", ")}`);
}
