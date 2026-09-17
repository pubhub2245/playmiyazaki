// Add ko fields to every camp listing.
import fs from "node:fs";
import path from "node:path";

const DIR = "data/listings/camp";

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

function addressKo(ja) {
  if (!ja) return null;
  let out = ja.replace("宮崎県", "미야자키현 ");
  const keys = Object.keys(CITY_KO).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (out.includes(k)) out = out.replaceAll(k, CITY_KO[k] + " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

function priceKo(ja) {
  if (!ja) return null;
  let s = ja;
  const rules = [
    ["RVパーク", "RV 파크"],
    ["キャンピングカー", "캠핑카"],
    ["中学生以上", "중학생 이상"],
    ["中学生以下", "중학생 이하"],
    ["小学生以下", "초등학생 이하"],
    ["3歳未満", "3세 미만"],
    ["3歳以下", "3세 이하"],
    ["2歳以下", "2세 이하"],
    ["幼児", "유아"],
    ["中学生", "중학생"],
    ["小学生", "초등학생"],
    ["高校生以上", "고등학생 이상"],
    ["高校生以下", "고등학생 이하"],
    ["高校生", "고등학생"],
    ["未就学児", "미취학 아동"],
    ["家族貸切風呂", "가족 대절 온천"],
    ["家族風呂", "가족탕"],
    ["貸切風呂", "대절탕"],
    ["日帰り入浴", "당일 입욕"],
    ["立ち寄り湯", "잠깐 온천"],
    ["入浴料", "입욕료"],
    ["入浴", "입욕"],
    ["回数券", "회수권"],
    ["清掃協力費込", "청소 협력비 포함"],
    ["清掃", "청소"],
    ["電源利用料込み", "전원 이용료 포함"],
    ["電源使用料", "전원 사용료"],
    ["電源不使用", "전원 미사용"],
    ["電源代別", "전원비 별도"],
    ["電源あり", "전원 있음"],
    ["電源なし", "전원 없음"],
    ["電源込み", "전원 포함"],
    ["電源込", "전원 포함"],
    ["電源", "전원"],
    ["水場", "물 사용처"],
    ["水道", "수도"],
    ["水", "물"],
    ["温水シャワー", "온수 샤워"],
    ["コインシャワー", "코인 샤워"],
    ["シャワー", "샤워"],
    ["休憩室", "휴게실"],
    ["管理費", "관리비"],
    ["日中", "낮"],
    ["宿泊", "숙박"],
    ["1泊2食付", "1박 2식 포함"],
    ["1泊朝食付", "1박 조식 포함"],
    ["1泊2日", "1박 2일"],
    ["1泊", "1박"],
    ["2泊まで", "2박까지"],
    ["3泊以上", "3박 이상"],
    ["3泊目以降", "3박째 이후"],
    ["2泊", "2박"],
    ["3泊", "3박"],
    ["素泊まり", "숙박만"],
    ["朝食", "조식"],
    ["夕食", "석식"],
    ["食事", "식사"],
    ["昼食", "점심"],
    ["ゴミ処理", "쓰레기 처리"],
    ["袋", "봉투"],
    ["電話予約制", "전화 예약제"],
    ["電話予約", "전화 예약"],
    ["予約", "예약"],
    ["フリーテントサイト", "프리 텐트 사이트"],
    ["フリーサイト", "프리사이트"],
    ["オートフリーサイト", "오토 프리사이트"],
    ["オートキャンプサイト", "오토캠핑 사이트"],
    ["オートキャンプ", "오토캠핑"],
    ["キャンピングカーサイト", "캠핑카 사이트"],
    ["キャンピングカー", "캠핑카"],
    ["常設テント", "상설 텐트"],
    ["持込テント", "지참 텐트"],
    ["持ち込み", "지참"],
    ["持込", "지참"],
    ["貸しテント", "텐트 대여"],
    ["テントサイト", "텐트 사이트"],
    ["テント", "텐트"],
    ["タープ", "타프"],
    ["ケビン", "케빈"],
    ["ログハウス", "로그 하우스"],
    ["バンガロー", "방갈로"],
    ["コテージ", "코티지"],
    ["キャビン", "캐빈"],
    ["ロッジ", "로지"],
    ["モバイルハウス", "모바일 하우스"],
    ["住箱", "주박"],
    ["BBQ棟", "BBQ 동"],
    ["BBQサイト", "BBQ 사이트"],
    ["BBQ", "BBQ"],
    ["バーベキュー棟", "바비큐 동"],
    ["バーベキュー", "바비큐"],
    ["ドッグラン", "도그런"],
    ["ペット", "반려동물"],
    ["区画電源オートサイト", "구획 전원 오토 사이트"],
    ["オートサイト", "오토 사이트"],
    ["レギュラーサイト", "레귤러 사이트"],
    ["グループサイト", "그룹 사이트"],
    ["個別サイト", "개별 사이트"],
    ["広場サイト", "광장 사이트"],
    ["ソロサイト", "솔로 사이트"],
    ["日帰りテント", "당일 텐트"],
    ["日帰り", "당일"],
    ["エリア", "구역"],
    ["区画", "구획"],
    ["張", "장"],
    ["棟", "동"],
    ["基", "기"],
    ["台", "대"],
    ["室", "실"],
    ["回", "회"],
    ["名まで", "명까지"],
    ["名", "명"],
    ["人用", "인용"],
    ["人棟", "인 동"],
    ["人数料金", "인원 요금"],
    ["人数", "인원"],
    ["人", "인"],
    ["1回", "1회"],
    ["1時間", "1시간"],
    ["1日", "1일"],
    ["7分", "7분"],
    ["3分", "3분"],
    ["2分", "2분"],
    ["24時間", "24시간"],
    ["15A", "15A"],
    ["温泉入場券付", "온천 입장권 포함"],
    ["温泉", "온천"],
    ["露天風呂", "노천탕"],
    ["大浴場", "대욕장"],
    ["別棟", "별동"],
    ["プール", "수영장"],
    ["薪", "장작"],
    ["輪", "묶음"],
    ["ダンプステーション", "덤프 스테이션"],
    ["給水", "급수"],
    ["ダンプ", "덤프"],
    ["立ち寄り", "잠깐"],
    ["トレーラー含む", "트레일러 포함"],
    ["トレーラー", "트레일러"],
    ["初日", "첫날"],
    ["2日目以降", "2일째 이후"],
    ["GW・夏休み・年末年始", "GW·여름방학·연말연시"],
    ["割引あり", "할인 있음"],
    ["割引", "할인"],
    ["最大", "최대"],
    ["オフシーズン", "오프시즌"],
    ["トイレなし", "화장실 없음"],
    ["トイレあり", "화장실 있음"],
    ["トイレ", "화장실"],
    ["バレルサウナ", "배럴 사우나"],
    ["サウナ", "사우나"],
    ["入場料", "입장료"],
    ["入場無料", "입장 무료"],
    ["入村料", "입장료"],
    ["別途入浴料", "입욕료 별도"],
    ["別途", "별도"],
    ["別", "별도"],
    ["込み", "포함"],
    ["込", "포함"],
    ["付", "포함"],
    ["セット", "세트"],
    ["税込", "부가세 포함"],
    ["税別", "부가세 별도"],
    ["ドリンクバー", "드링크바"],
    ["円", "엔"],
    ["大人", "대인"],
    ["小人", "소인"],
    ["子供", "어린이"],
    ["歳", "세"],
    ["11月〜3月", "11월~3월"],
    ["11〜3月", "11~3월"],
    ["月", "월"],
    ["泊", "박"],
    ["日", "일"],
    ["無料", "무료"],
    ["有料", "유료"],
    ["あり", "있음"],
    ["なし", "없음"],
    ["以上", "이상"],
    ["以下", "이하"],
    ["以内", "이내"],
    ["まで", "까지"],
    ["から", "부터"],
    ["および", "및"],
    ["、", ", "],
    ["。", ". "],
    ["（", " ("],
    ["）", ") "],
    ["／", " / "],
    ["〜", "~"],
  ];
  // Apply longest keys first so substrings do not fire before their compounds.
  const sorted = [...rules].sort((a, b) => b[0].length - a[0].length);
  for (const [a, b] of sorted) s = s.replaceAll(a, b);
  s = s.replace(/  +/g, " ");
  return s;
}

const MAP = {
  "aoidake": {
    name: "아오이다케 온천·아오이다케 캠프장",
    description: "아오이다케 온천과 같은 부지의 캠프장·RV 파크·차박 구역. RV 사이트에는 전원과 급수 있음.",
  },
  "aoshima-picnic-club": {
    name: "AOSHIMA PICNIC CLUB",
    description: "고도모노쿠니 내 캠프장·RV 파크 병설. 아오시마 유일의 JRVA 인증 RV 파크로 차박도 가능.",
  },
  "autocamp-takachiho": {
    name: "다카치호 오토캠프장",
    description: "다카치호 중심부에서 차로 5분. 같은 부지에 JRVA 인증 「RV 파크 다카치호」 병설.",
  },
  "dog-run-camp-suzu": {
    name: "DOG RUN & CAMP FIELD SUZU",
    description: "전세 캠프장과 도그런에 JRVA 인증 RV 파크를 병설.",
  },
  "ebino-kogen-hotel": {
    name: "에비노 고원 호텔 (국민 숙사 에비노 고원소)",
    description: "에비노 고원의 현립 국민 숙사. 당일 입욕도 가능.",
  },
  "futago-camp": {
    name: "후타고 캠프무라 오토캠프장",
    description: "니시메라손의 오토캠프장. 니시메라 온천 유타~토 근처.",
  },
  "gokase-no-sato": {
    name: "고카세노사토 캠프무라",
    description: "고카세초의 게스트하우스 병설 캠프장.",
  },
  "hachinosu-park-camp": {
    name: "하치노스 공원 캠프장",
    description: "니치난시 기타고의 사카타니강변 정영 캠프장. 여름에는 물놀이 가능.",
  },
  "hietsuki-no-sato": {
    name: "BASE CAMP shiiba",
    description: "시이바손의 댐 호숫가에 있는 코티지 병설 캠프장.",
  },
  "hinamori-autocamp": {
    name: "히나모리 오토캠프장",
    description: "기리시마 산 기슭, 해발 약 630m의 현립 오토캠프장. 여름에도 시원함.",
  },
  "hinokage-camp-mura": {
    name: "히노카게 캠프무라",
    description: "히노카게초의 고카세강변 캠프장. 텐트 사이트와 방갈로.",
  },
  "hinokage-onsen-eki": {
    name: "히노카게 온천역",
    description: "옛 다카치호 철도의 히노카게역을 재이용한 당일 온천 시설.",
  },
  "hokedake-park-camp": {
    name: "호케다케 공원 캠프장",
    description: "구니토미초 호케다케 공원 안의 정영 캠프장. 벚꽃과 단풍 명소.",
  },
  "horigawa-camp": {
    name: "호리가와 캠프장",
    description: "호리가와강변, 오구에야마 등산로 입구 근처의 캠프장.",
  },
  "hourigawa-bijin-no-yu": {
    name: "호리가와 온천 미인의 탕",
    description: "노베오카시 기타가와초의 당일 온천. 오구에야마 등산 후에 들르기 좋음.",
  },
  "hyuga-sunpark-autocamp": {
    name: "휴가 선파크 오토캠프장",
    description: "휴가시 남부·사치와키의 오토캠프장. 바다에 가깝다.",
  },
  "ikenokubo-green-park": {
    name: "이케노쿠보 그린 파크",
    description: "해발 약 800m의 모로쓰카손 캠프장. 방갈로와 텐트 사이트.",
  },
  "ishinamigawa-camp": {
    name: "이시나미가와 캠프장",
    description: "이시나미강변의 시영 캠프장. 여름철만 운영. 물놀이 가능.",
  },
  "jubei-no-yu": {
    name: "주베에의 탕 (교마치 온천)",
    description: "교마치 온천의 당일 입욕 시설. 가족 대절탕도 있음.",
  },
  "kadogawa-onsen-kokoro": {
    name: "가도가와 온천 마음의 숲",
    description: "가도가와초의 당일 온천. 해안 인근으로 해산물 식사 가능.",
  },
  "kannonike-koen": {
    name: "간논이케 공원",
    description: "미야코노조시 다카조초의 복합 시설. 캠프장, 수영장, 온천 「간논사쿠라노사토」 보유.",
  },
  "kannonsakura-no-sato": {
    name: "간논사쿠라노사토",
    description: "간논이케 공원 내 당일 온천. 노천탕 포함 13종의 욕조.",
  },
  "kataraustand": {
    name: "카타라우스탠드",
    description: "고카세초의 강변 프리사이트. 반려동물 가능.",
  },
  "keiryu-no-sato": {
    name: "모로쓰카산 계류의 마을",
    description: "모로쓰카산변의 계류에 있는 캠프장.",
  },
  "kijo-onsen-yurara": {
    name: "기조 온천관 유라라",
    description: "기조초의 당일 온천. 노천탕과 식사 공간 있음.",
  },
  "konohana-no-yu": {
    name: "고노하나의 탕 (미야자키시 자연 휴양촌 센터)",
    description: "미야자키시 가에다의 시영 당일 입욕 시설. 아오시마에서 차로 가까움.",
  },
  "kyomachi-kanko-hotel": {
    name: "교마치 관광 호텔",
    description: "교마치 온천의 호텔. 잠깐 온천도 가능.",
  },
  "laspa-takazaki": {
    name: "미야코노조 다카자키 온천 라스파 다카자키",
    description: "미야코노조 다카자키초의 당일 온천. RV 파크 다카자키에 가깝다.",
  },
  "makisui-park": {
    name: "보쿠스이 공원",
    description: "가인·와카야마 보쿠스이의 생가 근처, 휴가시 도고초의 공원 캠프장.",
  },
  "miike-no-yu-autocamp": {
    name: "미이케의 탕 오토캠프장",
    description: "미이케 호숫가, 천연 온천이 병설된 오토캠프장.",
  },
  "misato-lakeland": {
    name: "미사토 레이크랜드 (이시토게 레이크랜드)",
    description: "미미강 댐 호숫가의 복합 시설. 숙박, 캠핑, 온천 「미미강의 탕」.",
  },
  "miyazaki-shirahama": {
    name: "미야자키 시라하마 오토캠프장",
    description: "미야자키시 남부·시라하마 해안을 마주한 시영 오토캠프장. 아오시마에서 차로 가깝다.",
  },
  "mizushidani-furusato-mura": {
    name: "미즈시다니 후루사토무라 오토캠프장",
    description: "미사토초 난고의 강변 오토캠프장.",
  },
  "nango-onsen-dontaro": {
    name: "난고 온천 야마기리 (돈타로의 탕)",
    description: "미사토초 난고의 당일 온천. 산속의 조용한 입지.",
  },
  "oku-kirishima-miike-camp": {
    name: "오쿠키리시마 미이케 캠프무라",
    description: "미이케 호숫가의 캠프장. 텐트 사이트와 방갈로.",
  },
  "oseri-taki-camp": {
    name: "오세리 폭포 캠프장",
    description: "미사토초 사이고, 오세리 폭포 옆의 캠프장.",
  },
  "osuzu-camp": {
    name: "오스즈 캠프장",
    description: "오스즈 현립 자연공원 내의 정영 캠프장. 이용료 지불은 JR 쓰노역 관광협회에서.",
  },
  "otoshima-camp": {
    name: "무인도 「오토시마」 캠프장",
    description: "가도가와만의 무인도에 있는 배로 건너는 캠프장. 예약은 가도가와초 관광협회에서.",
  },
  "oujibaru-koen-camp": {
    name: "오지바루 공원 캠프장",
    description: "다카치호노미네 등산로 근처, 다카하루초 오지바루 공원의 캠프장.",
  },
  "riverside-aya-autocamp": {
    name: "리버사이드 아야 오토캠프장 (아야카와소)",
    description: "아야키타강변의 오토캠프장. 같은 부지의 아야카와소에서 당일 입욕 가능.",
  },
  "rvpark-kadogawa": {
    name: "RV 파크 가도가와",
    description: "농해산물 직매장 옆의 가도가와초 JRVA 인증 RV 파크.",
  },
  "rvpark-takazaki": {
    name: "RV 파크 다카자키",
    description: "다카자키 파크 골프장 병설의 JRVA 인증 RV 파크. 근처에 라스파 다카자키 온천.",
  },
  "rvparksmart-meirin": {
    name: "RV 파크 smart 다카나베초 메이린 공원",
    description: "다카나베 온천 메이린의 탕 옆, 메이린 공원 주차장에 정비된 RV 파크 smart.",
  },
  "sakaematsu-beach-camp": {
    name: "사카에마쓰 비치 캠프장",
    description: "난고 사카에마쓰 비치에 접한 오토캠프장. 해수욕과 캠핑을 같은 장소에서.",
  },
  "sakatani-camp": {
    name: "사카타니 캠프장",
    description: "미치노에키 사카타니 옆의 캠프장. 장보기는 미치노에키에서.",
  },
  "shikakawa-camp": {
    name: "시카카와 캠프장",
    description: "노베오카시 기타카타초, 규슈 척량 산속의 산악형 캠프장.",
  },
  "shikimibaru-sukoyaka": {
    name: "시키미바루 스코야카의 숲 캠프장",
    description: "해발 1,200m의 정영 캠프장. 규슈에서 가장 높은 캠프장 중 하나.",
  },
  "shimoso-hamayuu": {
    name: "시모아소 비치 「하마유무라」 솔레이유 르방",
    description: "미치노에키 기타우라 내 비치 캠프장. 시모아소 비치는 일본 해수욕장 100선.",
  },
  "shio-no-mori": {
    name: "시오노모리 캠프장",
    description: "옛 초등학교를 활용한 니치난의 캠프장.",
  },
  "shiratori-onsen-shimoyu": {
    name: "시라토리 온천 시모유",
    description: "에비노 고원 기슭의 당일 온천. 정원 노천탕과 대절탕이 있음.",
  },
  "sky-lodge-ginga": {
    name: "스카이 로지 긴가무라",
    description: "미사토초 기타고, 해발 약 900m의 산속 로지와 캠프장.",
  },
  "snow-peak-miyakonojo": {
    name: "스노우피크 미야코노조 캠프 필드 (세키노오 공원)",
    description: "세키노오 폭포 옆, 미야코노조시와 스노우피크의 관민 연계 캠프 필드.",
  },
  "sukimuland-kajika": {
    name: "스키무랜드 가지카의 탕",
    description: "고바야시시 스기의 스키무랜드 내 당일 온천.",
  },
  "sumie-family-village": {
    name: "스미에 가족 여행촌",
    description: "스미에 해수욕장 옆의 노베오카시 가족용 캠프장. 수영장과 수족관도 있음.",
  },
  "sun-cherry-kitago": {
    name: "선체리 기타고",
    description: "니치난시 기타고의 시영 온천 시설. 2024년 12월 재개.",
  },
  "sun-lupinus": {
    name: "선 루피너스",
    description: "신토미초의 라듐 온천. 정영 당일 시설.",
  },
  "takamatsu-camp-park": {
    name: "다카마쓰 캠프 공원",
    description: "다카마쓰 해수욕장 옆. 프리·오토·캠핑카·바비큐 사이트 보유.",
  },
  "toi-misaki-south-lighthouse": {
    name: "도이미사키 남등대 캠프장",
    description: "도이미사키 남쪽, 등대 근처의 캠프장. 주변에 야생마 미사키우마.",
  },
  "tsubakiyama-camp": {
    name: "쓰바키야마 캠프장",
    description: "미야자키시 산속의 시영 캠프장. 쓰바키야마 삼림공원 내.",
  },
  "welvillage-campers-ibii": {
    name: "웰빌리지·캠퍼스 이비이",
    description: "이비이역 근처 니치난의 캠프장. 바다까지 걸어갈 수 있음.",
  },
  "yatake-kogen-belton": {
    name: "야타케 고원 벨턴 오토캠프장",
    description: "에비노시 야타케 고원의 오토캠프장. 전망대에서 에비노 분지를 조망.",
  },
  "yatate-kogen-shiiba": {
    name: "야타테 고원 캠프장",
    description: "시이바손 고원의 캠프장.",
  },
  "yunomoto-onsen": {
    name: "유노모토 온천",
    description: "다카하루초의 탄산천. 당일 입욕도 가능.",
  },
  "yupoppo-kakashi-no-sato": {
    name: "카카시노사토 유폿포",
    description: "미야코노조시 야마다초의 당일 온천. 카카시노사토 복합 시설 내.",
  },
  "yutato-nishimera": {
    name: "니시메라 온천 카리코보즈의 탕 유타~토",
    description: "니시메라손 중심부의 당일 온천. 지역 요괴 카리코보즈에서 이름 유래.",
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
  if (j.price) j.price.ko = priceKo(j.price.ja);
  if (j.description) j.description.ko = m.description;

  fs.writeFileSync(fp, JSON.stringify(j, null, 2) + "\n", "utf8");
  touched += 1;
}

console.log(`ko fields added to ${touched} camp listing(s).`);
if (missing.length) console.log(`Missing: ${missing.join(", ")}`);
