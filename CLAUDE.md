# TTAS 檢傷遊戲 — Claude Code 工作說明

台灣急診五級檢傷（TTAS）課堂互動遊戲：講師電腦投影 `/host`，學員手機掃 QR code 作答。
Cloudflare Workers + Durable Objects（WebSocket 即時同步）。

本 repo 是 monorepo，含 classic（已上線的遊戲本體）與 course（PGY1 課程教案設計）兩層，
細節見下方「Monorepo：classic / course 兩模式」。

## 重要限制

- `src/questions.js` 的題目、正解、解說、依據是**急診醫師臨床審核過的內容**，
  未經使用者明確指示，不得修改任何臨床相關文字或數值。
- `src/index.js` 的計分與遊戲規則已通過整合測試，修改前先向使用者確認。
- **v1 不可動原則**：任何 `course/` 文件、CI 設定、或其他非 v1 任務，一律**不得**順手修改
  `src/` 或 `public/`（v1 遊戲程式碼）。v1 是已上線、已通過整合測試的 classic 模式，
  改動須是使用者明確要求的獨立任務，不可在別的任務裡「順便」動它。
- 回應一律使用繁體中文。

## Monorepo：classic / course 兩模式

| 路徑 | 模式 | 說明 |
|---|---|---|
| `src/` + `public/` | **classic** | 已上線部署的遊戲本體，即本文件其餘章節描述的對象 |
| `course/` | **course** | PGY1 急診入門課程的設計文件、講師手冊、v2 內容檔、紙本教具；目前僅設計文件，尚未整合進 `src/`。入口見 `course/README.md`，上課操作腳本見 `course/docs/TEACHING_GUIDE_v2.md` |

`course/**` 與所有 `*.md` 的變更不會觸發 Cloudflare 部署（`.github/workflows/deploy.yml` 的
`paths-ignore` 已排除），所以改課程文件不會誤觸發 v1 的線上部署。

## 常用指令

- 安裝：`npm install`
- 本地測試：`npx wrangler dev`（開 http://localhost:8787/ 與 /host）
- 部署：`npx wrangler deploy`（雲端環境需已設 `CLOUDFLARE_API_TOKEN` 環境變數，
  不要嘗試 `wrangler login`——sandbox 內沒有瀏覽器）
- 若 deploy 要求 account_id：`npx wrangler whoami` 取得後填入 wrangler.jsonc 的 `account_id`

## 檔案地圖

- `src/index.js` — Worker 入口 + GameRoom Durable Object（遊戲伺服器、計分、alarm 計時）
- `src/questions.js` — 題庫（QUIZ 12 題、PATIENTS 10 位）與參數（CONFIG、SCORING）
- `public/index.html` — 學員手機端
- `public/host.html` — 講師投影端
- `wrangler.jsonc` — Cloudflare 設定（DO binding、assets）
- `course/` — PGY1 課程設計、講師手冊、v2 內容檔、紙本教具（course 模式，見 `course/README.md`）

## 修改題目的標準流程

1. 只動 `src/questions.js` 中使用者指定的欄位
2. `node --check src/questions.js` 確認語法
3. `npx wrangler deploy`
4. 回報部署網址
