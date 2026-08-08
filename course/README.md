# PGY1 急診醫學入門課程包

第一週輪訓急診之 PGY1 醫師的 **3 小時互動 + 遊戲化課程**完整設計與教具。
以 ABEM 2022 EM Model 三維度（Patient Acuity × Physician Tasks × Knowledge/Skills）為學理骨架，
用「邊做決定邊惡化」的遊戲情境，帶新手建立急診 problem-based thinking 的基模。

> 核心設計理念：Kolb 經驗學習循環的反思發生在「作答後、揭曉前」那個停頓，
> 而不是在遊戲本身。整套教具與系統機制都在保護那個停頓。

---

## course/ 資料夾是什麼

這裡放的是**課程設計、講師手冊、內容資料與紙本教具**——也就是「怎麼教、教什麼」。
實際上課用的**網頁遊戲程式**（Cloudflare Workers + Durable Objects）在本 repo（monorepo）的 `src/` 與 `public/`：

兩者的關係：

| 路徑 | 角色 |
|---|---|
| **`src/` + `public/`** | 執行遊戲的 web app（講師投影端 `/host`、學員手機端）；Part 1 檢傷題庫維護在 `src/questions.js` |
| **`course/`（本資料夾）** | 課程設計文件、講師手冊、v2 內容檔、紙本降級教具 |

---

## 兩個版本 / 兩層設計（重要，先讀這段）

這批文件橫跨兩個世代的設計，**兩者互補、不衝突**：

1. **母體課程設計（紙本 5 遊戲版）** — 完整的 180 分鐘課程藍圖與可獨立運作的紙本教具。
   即使完全不用電腦也能開課，也是數位版故障時的**降級包**。
   - [`docs/PGY1_EM_orientation_3hr_course.md`](docs/PGY1_EM_orientation_3hr_course.md)
   - [`materials/PGY1_EM_game_materials.md`](materials/PGY1_EM_game_materials.md)

2. **數位版 v2（web app 版）** — 在 er-triage 既有專案上擴充的新機制：
   三段式 `commit → 顯示分佈 → 揭曉`、Part 2 三題遞進 ABCDE、Part 3 五岔路口整合案例、前後測。
   - [`docs/SPEC_v2_instructor_game.md`](docs/SPEC_v2_instructor_game.md)
   - [`content/content_v2.json`](content/content_v2.json)
   - [`docs/TEACHING_GUIDE_v2.md`](docs/TEACHING_GUIDE_v2.md)

> 上課時：用 **v2 講師手冊** 當現場操作腳本、**紙本教具包** 當降級後援。

---

## 檔案總覽

```
ER_PGY_orientation/
├── README.md                                  ← 你正在讀的這份
├── docs/
│   ├── PGY1_EM_orientation_3hr_course.md       完整課程設計（總目標、逐模組逐頁 slide、EM Model 附錄、參考資料）
│   ├── TEACHING_GUIDE_v2.md                     v2 講師操作手冊（180 分鐘時間表、debrief 腳本、控制台操作、降級包）
│   └── SPEC_v2_instructor_game.md               v2 開發規格書（phase 流程、狀態模型、三段式機制、降級路徑）
├── materials/
│   └── PGY1_EM_game_materials.md                紙本教具包（卡牌 24 張、檢傷題 10、LR 情境 3、病人卡 4、Final Boss 腳本、製作 checklist）
└── content/
    └── content_v2.json                          v2 遊戲內容檔（前後測、Part 2、Part 3；程式讀此檔，不硬編臨床內容）
```

| 你想做的事 | 看這份 |
|---|---|
| 了解整堂課的設計理念與學理 | `docs/PGY1_EM_orientation_3hr_course.md` |
| 今天要進教室上課、照著跑 | `docs/TEACHING_GUIDE_v2.md` |
| 改題目、案例、解析 | `content/content_v2.json`（臨床內容集中於此，講師換題只改 JSON） |
| 準備紙本教具 / 停電斷網降級 | `materials/PGY1_EM_game_materials.md` |
| 接手開發 web app | `docs/SPEC_v2_instructor_game.md` + 本 repo（monorepo）的 `src/` |

---

## Part 1 題庫在哪裡

`content_v2.json` 的 **Part 1（檢傷）沿用既有題庫 v1.1，本資料夾不重複收錄**。
題庫（12 題 quiz + 10 位模擬病人 + CONFIG／SCORING 參數）維護於同 repo：

> **[`../src/questions.js`](../src/questions.js)**

`content_v2.json` 內以 `part1_ref` 欄位標記此相依關係，未來若要改 Part 1 題目請改 `src/questions.js`。

---

## 課程五大主題（對回 EM Model）

| 主題 | 對應 EM Model 維度 |
|---|---|
| Problem-based thinking（先排除致命，再找診斷） | Patient Acuity |
| 檢傷五級與嚴重度（TTAS） | Patient Acuity |
| Primary → Secondary survey + 檢查的機率思維（LR） | Emergency stabilization + Diagnostic studies |
| Disposition 四種去向與資源有限性 | Transitions of care |
| Closed-loop communication 與 ISBAR 照會 | Team leadership + Communication |

---

## 授權與臨床免責

- **臨床內容為教學設定值**：本課程所有數值、案例與處置為**教學設計**，非臨床指引。
  實際臨床請依現行指引與院內規範。檢傷分級與 EM Model 之官方來源見各文件末的參考資料與 `content_v2.json` 的 `sources`。
- **前後測隱私**：學員填自訂代號、非真名，系統不預設收集可識別資料。若日後作教學研究用途，
  仍須依貴院 IRB 規範處理知情同意（見 `TEACHING_GUIDE_v2.md` §五）。
- **授權**：本 repo 尚未附 LICENSE。若要對外分享，建議加一份授權條款（教材類常用 CC BY-NC-SA），
  並保留各臨床來源的出處標示。
