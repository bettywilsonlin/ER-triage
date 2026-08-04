// TTAS 檢傷遊戲題庫 v1.1（成人標準；依「急診五級檢傷分類基準-修正版總表」）
// 修改題目請直接編輯本檔後重新 `npx wrangler deploy`

export const CONFIG = {
  quizSecs: 25,          // quiz 預設作答秒數（個別題可用 secs 覆寫）
  ptSecs: 30,            // 模擬病人作答秒數
  ptGapSecs: 40,         // 病人揭曉後到下一位抵達的間隔
  bedCount: 2,           // 每位學員的急救床數
  bedHoldPatients: 3,    // 佔床持續幾位病人
  detDelayPatients: 2,   // under-triage 後幾位病人抵達時觸發惡化事件
};

export const SCORING = {
  quizBase: 100,         // quiz 答對基本分
  quizSpeedMax: 50,      // quiz 速度加成上限
  simCorrect: 100,       // 模擬：級數正確
  simOffByOne: 40,       // 模擬：差一級
  simUnder2: 0,          // 模擬：under-triage 差 ≥2 級（並觸發惡化）
  overTriage: -20,       // 模擬：把 ≥3 級病人分成 1-2 級
  noBed: -30,            // 模擬：分 1-2 級但無急救床可用（額外扣分）
  deterioration: -50,    // 惡化事件對肇事者的扣分
};

// kind: "level" = 選 1~5 級；"choice" = 自訂選項（ans 為選項索引，從 0 起算）
export const QUIZ = [
  { kind: "level", text: "52 歲男性，SBP 88 mmHg，皮膚濕冷蒼白、脈搏微弱。", ans: 1,
    explain: "血壓偏低（SBP<90）伴隨典型休克徵象 → 1 級。SBP<90 本身只有 2 級，「有無休克徵象」才是 1 vs 2 的分水嶺。",
    src: "表一．血行動力" },
  { kind: "level", text: "47 歲女性，SBP 85 mmHg，意識清楚、皮膚溫暖，無休克徵象。", ans: 2,
    explain: "血壓偏低（SBP<90）未有典型休克徵象 → 2 級。與上一題對照。",
    src: "表一．血行動力" },
  { kind: "level", text: "60 歲男性，心悸，HR 148 次/分，無休克徵象與症狀。", ans: 2,
    explain: "心跳速率 >140 次/分、無休克徵象 → 2 級。",
    src: "表一．血行動力" },
  { kind: "choice", secs: 40,
    text: "70 歲女性，虛弱，BP 84/48 mmHg。MAP 是多少？該分幾級？",
    options: ["MAP 66 → 2 級", "MAP 66 → 3 級", "MAP 60 → 2 級", "MAP 60 → 3 級"], ans: 2,
    explain: "MAP＝(SBP−DBP)/3＋DBP＝(84−48)/3＋48＝60 mmHg；MAP<65 → 2 級。（MAP 66 是把收縮壓舒張壓直接平均的常見錯誤）",
    src: "表一．血行動力（備註 6）" },
  { kind: "level", text: "55 歲男性，呼吸困難，說話可成句，SpO2 91%（無慢性肺病史）。", ans: 2,
    explain: "SpO2 <92% → 2 級。",
    src: "表一．呼吸" },
  { kind: "level", text: "38 歲男性，急性意識改變（今晨開始），GCS E3V4M5＝12。", ans: 2,
    explain: "GCS 9-13 → 2 級。意識調節變數只適用 7 天內急性變化；GCS 14-15 改依主訴分級。",
    src: "表一．意識" },
  { kind: "level", secs: 30,
    text: "72 歲 COPD 病人，平常 SpO2 就在 88-90%。今日走動時較喘，說話成句、無明顯呼吸費力，檢傷 SpO2 88%。", ans: 3,
    explain: "SpO2 不適合用於長期缺氧、COPD 病人（表一備註 2）。依綜合描述屬輕度呼吸窘迫 → 3 級。",
    src: "表一．呼吸（備註 2）" },
  { kind: "level", text: "40 歲女性，發燒 38.8°C，乳癌化療中，看起來疲倦。", ans: 2,
    explain: "免疫功能缺陷（化療中）＋發燒 → 2 級。",
    src: "表一．體溫" },
  { kind: "level", text: "30 歲男性，發燒 38.5°C，心跳脈壓正常、意識警醒、看起來無病容。", ans: 4,
    explain: "看起來無病容 → 4 級。發燒除中樞體溫 >41°C 外不以絕對值分級，看病容與免疫功能狀態。",
    src: "表一．體溫" },
  { kind: "choice", secs: 30,
    text: "50 歲男性，主訴頭痛，檢傷血壓 195/105 mmHg。",
    options: ["2 級", "3 級", "4 級", "不符高血壓急症基準，改依「頭痛」主訴分級"], ans: 3,
    explain: "使用高血壓急症主訴須符合 SBP≥200 或 DBP≥110；195/105 不符 → 應改以頭痛為主訴及其判定依據分級。",
    src: "表五．高血壓急症（備註 2、3）" },
  { kind: "level", text: "48 歲男性，主訴頭暈，檢傷血壓 210/118 mmHg。", ans: 3,
    explain: "有症狀（眩暈）＋ SBP 200-220（DBP 110-130 亦同區間）→ 3 級。與上一題對照：有無症狀差一級。",
    src: "表五．高血壓急症" },
  { kind: "level", secs: 30,
    text: "25 歲機車騎士，被時速約 40 公里汽車撞擊後人車分離。到院意識清楚、生命徵象完全正常、只喊腳痛（4/10）。", ans: 2,
    explain: "機車被車速 >30 km/h 汽車撞擊、人車分離 → 高危險性受傷機轉 → 2 級。生命徵象正常 ≠ 低級數；受傷機轉是獨立的首要調節變數。",
    src: "表三．高危險性受傷機轉" },
];

// 模擬病人。vitals 供投影端以監視器風格顯示；det 為 under-triage 時的惡化事件文字（null＝無）。
export const PATIENTS = [
  { label: "P1", vign: "68 歲男性，喘，只能單字回答，口唇發紺。",
    vitals: { T: "36.8", HR: 118, BP: "142/88", RR: 32, SpO2: 86 }, ans: 1,
    explain: "重度呼吸窘迫：單字說話、發紺、SpO2<90% → 1 級。",
    src: "表一．呼吸",
    det: "P1 在候診區呼吸衰竭倒地，緊急插管！" },
  { label: "P2", vign: "30 歲男性，打籃球扭傷腳踝，痛 3/10，自行走入。",
    vitals: { T: "36.5", HR: 82, BP: "128/76", RR: 16, SpO2: 99 }, ans: 5,
    explain: "周邊型輕度疼痛（<4）→ 5 級。",
    src: "表二．疼痛程度", det: null },
  { label: "P3", vign: "45 歲女性，車禍從車內被彈出，意識清楚，頸部酸痛。",
    vitals: { T: "36.6", HR: 92, BP: "132/80", RR: 18, SpO2: 98 }, ans: 2,
    explain: "從車內被彈出＝高危險性受傷機轉 → 2 級，即使生命徵象正常。",
    src: "表三．高危險性受傷機轉",
    det: "P3 出現雙下肢麻木——頸椎損傷惡化！" },
  { label: "P4", vign: "76 歲女性，發燒，淋巴瘤化療中，看起來疲倦。",
    vitals: { T: "38.9", HR: 104, BP: "118/70", RR: 20, SpO2: 96 }, ans: 2,
    explain: "免疫功能缺陷（化療中）＋發燒 → 2 級。",
    src: "表一．體溫",
    det: "P4 進展為敗血性休克，血壓掉到 78/40！" },
  { label: "P5", vign: "25 歲女性，突發下腹劇痛 9/10，冒冷汗。",
    vitals: { T: "36.9", HR: 108, BP: "112/68", RR: 20, SpO2: 98 }, ans: 2,
    explain: "中樞型重度疼痛（8-10）→ 2 級。",
    src: "表二．疼痛程度",
    det: "P5 在候診區暈厥，複測 SBP 78！" },
  { label: "P6", vign: "58 歲男性，健檢發現血壓高來院，完全無症狀。",
    vitals: { T: "36.4", HR: 78, BP: "224/118", RR: 16, SpO2: 98 }, ans: 3,
    explain: "無症狀＋SBP≥220 → 3 級。不需佔用急救床——over-triage 的教學點。",
    src: "表五．高血壓急症", det: null },
  { label: "P7", vign: "82 歲女性，家屬述今早開始叫不太醒，GCS E3V4M5＝12。",
    vitals: { T: "37.2", HR: 96, BP: "150/84", RR: 18, SpO2: 95 }, ans: 2,
    explain: "急性意識改變、GCS 9-13 → 2 級。",
    src: "表一．意識",
    det: "P7 的 GCS 掉到 8，需要插管保護呼吸道！" },
  { label: "P8", vign: "40 歲男性，喉嚨痛流鼻水 2 天，無發燒，看起來無病容。",
    vitals: { T: "37.0", HR: 76, BP: "124/78", RR: 14, SpO2: 99 }, ans: 4,
    explain: "一般主訴、無首要調節變數升級條件 → 4 級。",
    src: "一般主訴（無調節變數）", det: null },
  { label: "P9", vign: "66 歲女性，服用 warfarin，牙齦出血半小時壓不住。",
    vitals: { T: "36.6", HR: 84, BP: "134/80", RR: 16, SpO2: 98 }, ans: 3,
    explain: "凝血異常＋口腔（含牙齦）出血屬中輕度出血 → 3 級。",
    src: "表十．凝血異常", det: null },
  { label: "P10", vign: "50 歲男性，上腹不適半小時，大量冒冷汗、皮膚蒼白濕冷。",
    vitals: { T: "36.2", HR: 122, BP: "82/54", RR: 24, SpO2: 95 }, ans: 1,
    explain: "SBP<90 ＋典型休克徵象（蒼白、濕冷、盜汗）→ 1 級。",
    src: "表一．血行動力",
    det: "P10 在候診區 OHCA！——本場最重要的 under-triage 教訓。" },
];
