# ER-triage ＋ ER_PGY_orientation 整合（急診教學遊戲）— 待辦

> 下一步永遠放最上面，BOARD 只抓最上面 1–2 項。
> 建檔日 2026-09-10（agent-audit 補登記；在此之前這個專案沒有 TODO.md，所以進不了 BOARD 自動追蹤）。
> 深層背景：`README.md`、SPEC、ledger `.superpowers/sdd/progress.md`（⚠️ 被 .gitignore 排除，不在 GitHub 上）。

> 📌 **`main` = `78d207e`**（2026-09-10 實查：本地與 origin/main 同步、無未推提交）。
> **看到這串號碼先當它可能已經過期，自己跑一次 `git log --oneline -1`。**
> ⚠️ BOARD 與 ledger 兩處都還寫著舊的 `33878c9`，2026-09-10 訂正——
> 那之後多了一筆 `78d207e`（CI 的 actions/checkout 與 setup-node 升到 v7）。

> 🔗 **計畫書與 SPEC 都不在這個 repo 裡**，在 hub：
> `docs/superpowers/plans/2026-08-20-er-triage-降級路徑與part2.md`（現行，8 個 Task）
> `docs/superpowers/plans/2026-08-07-er-triage-monorepo-v2.md` 的 **Phase 3–4 已作廢**（該檔上方有擋牆）。

## 🔴 下一步

- [ ] **Task A1：斷線重連認得 course 與 idle phase**（SPEC §9.3）
      計畫書行號約 107–222。第一步是寫失敗測試，產出 `test/degrade.test.js`。
      實作重點：把 `sendSync` 的組裝抽成 `syncPayload`，`phase === "course_q"` 時補上 `out.cq`。
      **卡：無。可直接開工。**

## 接著做

### Phase A — 降級路徑（SPEC §9，硬性需求）

- [ ] **Task A2：idle phase**（畫面退場但房間不解散）— 依賴 A1 的 `syncPayload`；host 要加暫停／繼續鈕，學員端加待機卡
- [ ] **Task A3：跳關與手動加減分**（SPEC §9.1、§9.2）— host UI 加跳關與加減分
- [ ] 🏁 **里程碑 M2**：`npm test` 全綠 ＋ `wrangler dev` 人工走一遍（暫停→繼續→跳關→手動加分→學員 F5 重連仍在正確畫面）＋ 跑一次 `superpowers:requesting-code-review`（重點看 classic 有沒有被動到）

### Phase B — Part 2 三題遞進（SPEC §4）

- [ ] **Task B1：精簡版分組**（SPEC §6）— 一鍵隨機分兩隊，**跳過**翻牌動畫與講師手動調整（使用者 2026-08-20 拍板）
- [ ] **Task B2：三級結果引擎**（純函式，SPEC §4.4＋§4.5）
- [ ] **Task B3：伺服器串接 Part 2**（demo → faded 5 步 → solo）
- [ ] **Task B4：講師端 Part 2 UI**
- [ ] **Task B5：學員端 Part 2 UI**（含排序作答介面）
- [ ] 🏁 **里程碑 M3**：Part 2 完成

## 🔑 等使用者拍板（我不能代決定）

- [ ] **合併 main ＝ 觸發 Cloudflare 正式部署**（要合併時我先給 diff 摘要）
- [ ] **舊 `ER_PGY_orientation` repo 要不要 archive**
- [ ] **`course/` 教材要用什麼 LICENSE**

## ⚠️ 冷讀者必知（動工前一定要看）

- **`src/index.js` 至今只 `import` `questions.js`，`CONTENT_V2` 從未接進伺服器。**
  舊 Task 1.1 只建了模組與 schema（`src/content_v2.js` 存在），**沒接線**。
  Task B1 是第一次接線。2026-09-10 實查確認：`grep content_v2 src/index.js` 零命中。
- **Part 2 的三級是「穩定／惡化／死亡」，不是 optimal/acceptable/harmful。**
  舊計畫寫錯了，判定依據是比對 `outcomeRule` 的四個清單，不是每個選項標 tier 查表。
  實測佐證：`content_v2.json` 搜尋 `tier`／`optimal`／`acceptable`／`branch`／`replay` **全部 0 次**。
- **faded 是 5 個 sub-step**（每步各跑三段、40 秒），不是一個 phase。
- **分歧點回放一律必做**，不是條件觸發——死亡不得無法歸因。
- 現有測試：`classic_regression`／`content_v2`／`course_phases`／`quiz_pause` 四支。
  `test/degrade.test.js`、`src/part2.js` **都還沒建**（2026-09-10 確認）。
- `public/host.html:168` 註明「伺服器端 course 邏輯保留，目前無按鈕觸發」——2026-08-14 UI 精簡的遺留。

## ✅ 已完成

- [x] **P0 上線**（2026-08-08）
- [x] **UI 精簡上線**（2026-08-14）— 三段式併進 classic Round 1 的 `b-next`，course 控制列移除
- [x] **使用者實際上課驗證 Part 1**（2026-08-20）— M1 檢查點的前置條件達成
- [x] CI 維護（Node 20→22 對齊 wrangler 4.x；actions 升 v7）

線上：<https://ttas-triage-game.bettywilsonlin.workers.dev>（`/host` 講師端、`/?room=` 學員端）
