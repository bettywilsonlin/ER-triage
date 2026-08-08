# PGY1 急診互動遊戲 v2 — 開發規格書
**交付對象**：Claude Code（接續既有專案）
**既有基礎**：Cloudflare Workers + Durable Objects 的 TTAS 檢傷遊戲（題庫 v1.1：quiz 12 題 + 模擬病人 10 位），房間碼 + 暱稱加入、手機作答、投影幕顯示皆已存在。
**本次任務**：在既有專案上擴充為完整三部分課程遊戲，並補上「反思觀察」機制。

---

## 0. 本次擴充的四件事（依優先順序）

| 優先 | 功能 | 理由 | 預估工作量 |
|---|---|---|---|
| **P0** | **commit → 顯示分佈 → 揭曉答案** 三段式控制 | 整份規格 CP 值最高。Kolb 循環的「反思觀察」缺口全靠它補 | 小（控制台兩顆按鈕 + 一個 phase） |
| **P0** | Part 2：三題遞進的 ABCDE 處置關卡（demo / faded / independent） | 取代原本「單題兩分鐘 + 生死二元」設計 | 中 |
| **P0** | 三級結果 + 分歧點回放 | 取代二元生死回饋 | 中 |
| **P1** | Part 3：五岔路口整合案例（單一病人） | 主動實驗階段 | 中 |
| **P2** | Part 3 進階版：ED board 多病人 + 遊戲時鐘 + OHCA 插入事件 | 教 task switching。**第一次上課不需要** | 大 |
| **P1** | 前後測（同 3 題，課首課尾各一次）+ 差異對照頁 | 學習成效資料，可作教學研究用 | 小 |

**若時間有限，只做 P0 三項即可上線。** P1 可在第二梯次前補；P2 明確標為 v3。

---

## 1. 場次流程與 phase 對應

| 課程段落 | 形式 | 系統 phase |
|---|---|---|
| 開場講課（急診是什麼、problem-based thinking） | 純講述 | `lobby`（投影幕顯示房間碼 QR，學員陸續加入、填代號） |
| **前測 3 題** | 遊戲 | `pretest` |
| 隨機分組 | 系統執行 | `grouping` |
| **Part 1：我是檢傷（10 位病人）** | 遊戲（沿用既有題庫） | `part1_*` |
| Part 1 debrief | 討論 | `distribution` → `reveal` → `debrief` |
| **Part 2：我是醫師（demo → faded → independent）** | 遊戲 | `part2_demo` / `part2_faded` / `part2_solo` |
| 資源、disposition、團隊溝通 | 純講述 | `idle`（投影幕顯示講師自備投影片，遊戲畫面待機） |
| **Part 3：整合案例五岔路口** | 遊戲 + 討論 | `part3_junction_1..5` |
| **後測（同前測 3 題）+ 前後對照** | 遊戲 | `posttest` → `compare` |
| 結算 | — | `final` |

`idle` phase 很重要：中段有兩次純講課，畫面必須能「退場」但房間不解散、學員手機不掉線（顯示「請看投影幕，稍後繼續」）。

---

## 2. 狀態模型（Durable Object）

```ts
interface RoomState {
  code: string;                    // 4 碼房間碼
  phase: Phase;
  players: Record<PlayerId, {
    nickname: string;              // 學員自填代號
    teamId: string | null;
    connected: boolean;
  }>;
  teams: Record<TeamId, {
    name: string;                  // 系統給趣味隊名，見 §6
    memberIds: PlayerId[];
    score: number;
    tokens: number;                // 資源籌碼，跨 part 持續
  }>;
  current: {
    itemId: string | null;         // 指向 content.json 的題目
    stepIndex: number;             // faded 模式的步驟指標
    endsAt: number | null;         // 倒數截止（epoch ms），null = 不限時
    answersLocked: boolean;
  };
  answers: Record<ItemId, Record<PlayerId, {
    value: string | string[];
    ms: number;                    // 作答耗時
    committedAt: number;
  }>>;
  teamAnswers: Record<ItemId, Record<TeamId, string | string[]>>;
  log: Array<{ t: number; type: string; payload: unknown }>;  // 全場事件流水，結束匯出
}
```

**必守規則**
- `tokens` **跨 phase 持續**，不得在切換 part 時重置。這是整場遊戲的經濟骨幹。
- `answers` 保留每個人的個別作答（不只團隊答案），前後測對照與分佈顯示都靠它。
- 斷線重連：以 `playerId`（localStorage）復原，不重新加入房間。

---

## 3. P0-1：commit → 顯示分佈 → 揭曉（核心機制）

### 三段式 phase
```
answering   → 學員作答，投影幕只顯示「已作答 n/6」，不顯示任何內容
distribution→ 投影幕顯示答案分佈長條圖，【不顯示何者為正確答案】
reveal      → 顯示正確答案 + 解析 + 依據條文
```

### 講師控制台按鈕（三顆分離，絕不可合併）
| 按鈕 | 動作 |
|---|---|
| `結束作答` | `answersLocked = true`，phase → `distribution` |
| `揭曉答案` | phase → `reveal` |
| `下一題` | phase → `answering`（下一 itemId） |

### 分佈顯示規格
- **匿名**：只顯示「選 2 級：3 人／選 3 級：2 人／選 4 級：1 人」，不顯示誰選了什麼
- 講師控制台**可以**看到個別作答（講師需要知道誰在狀況外）
- 若全班答案一致，控制台顯示提示：「全班一致，可直接揭曉」
- 若分歧 ≥ 2 種且少數方 ≥ 1 人，控制台顯示提示：**「有分歧 — 建議先問理由再揭曉」**

這個提示是設計重點：講師在課堂上很容易急著按揭曉，系統要主動擋一下。

---

## 4. P0-2：Part 2 三題遞進

### 4.1 `part2_demo`（示範題，學員不作答）
- 投影幕依講師節奏逐步揭示：生命徵象 → A 的判斷 → B 的判斷 →⋯
- 控制台一顆 `下一步` 按鈕，講師邊按邊 think-aloud（講稿見 TEACHING_GUIDE）
- 學員手機顯示：「示範中，請看投影幕」
- **不計分、不計時**

### 4.2 `part2_faded`（半引導題）
- 系統把處置拆成 5 個步驟（A→B→C→D→E），**依序**出現
- 每步驟：投影幕顯示當前病況與該步的情境，手機顯示 3–4 個選項（單選）
- 每步驟走完整的 commit → distribution → reveal 三段
- 每步限時 40 秒
- 選錯不中斷流程，但記錄於 `divergencePoints`

### 4.3 `part2_solo`（獨立題）
- 手機顯示 8 個處置卡片，學員**排序**選出前 4 個動作（拖曳或依序點選）
- 限時 120 秒
- 團隊作答（組內討論後由一人送出）——真實 resuscitation 是團隊行為
- 送出後進 `distribution`：投影幕並列兩隊的排序

### 4.4 三級結果引擎
評分不比對「唯一正解」，而是比對 **critical actions 清單**：

```ts
interface OutcomeRule {
  criticalActions: string[];      // 必做且必須在前 N 步
  timeSensitive: { action: string; mustBeWithinTop: number }[];
  fatalOmissions: string[];       // 漏掉即 death
  harmfulActions: string[];       // 做了會惡化
}
```

判定順序：
1. 命中任一 `fatalOmissions` → **死亡**
2. 命中 `harmfulActions`，或漏掉非致命的 critical action → **惡化**
3. 全數命中 → **穩定**

### 4.5 分歧點回放（必做）
結果畫面固定三行，缺一不可：

```
【結果】病況惡化
【你的分歧點】第 2 步：你選了「12-lead ECG」
【專家路徑與理由】此步應為「高流量給氧 + 建立兩條大孔徑 IV」
              — SpO2 88% 尚未處理，ECG 不會改變你此刻該做的事
```

**硬性規則：死亡結果一律附帶明確的單一分歧點與因果句，不得出現無法歸因的死亡。** 內容端已為每個 `fatalOmission` 綁定一則 `causalExplanation`（見 content.json），前端不得省略。

---

## 5. P1-1：Part 3 五岔路口

- 單一病人，5 個決策點，每個決策點走完整三段式（commit → distribution → reveal）
- 流程：**個人 commit（手機）→ 組內討論 60 秒 → 組別提交 → 分佈 → 討論 → 揭曉**
  - 個人與組別兩層都要記錄：個人答案用於顯示分歧，組別答案用於計分
- 岔路 3（檢查選擇）與岔路 4（disposition）**消耗籌碼**，餘額即時顯示於投影幕
- 終局頁：四項並列 —— 各組路徑、籌碼餘額、病人結局、**出院後 72 小時追蹤結果**

## 5b. P2：Part 3 進階版（v3，本次不實作，僅保留擴充點）
- ED board 同時 4 位病人、遊戲時鐘（90 分鐘壓縮為 20 分鐘真實時間）
- 未處理病人隨時間惡化
- 中途插入事件：「119 通知 10 分鐘後 OHCA 到院」→ 強制重新排序、清空一床
- 資料結構請預留：`content.json` 的 `part3_board` 欄位已定義 schema 但內容為空

---

## 6. 分組

- 觸發點：前測結束後、Part 1 開始前
- 6 人 → 2 隊 × 3 人；8 人 → 2×4；10 人 → 2×5（**固定 2 隊**，小班兩隊競爭張力最佳）
- 隨機演算法：Fisher–Yates shuffle，不做能力平衡（無前置資料可平衡，也避免標籤化）
- 分組動畫：投影幕逐一翻牌顯示成員，這是很好的破冰節點
- 隊名由系統從清單隨機指派（含在 content.json：紅班、藍班、綠班、黃班 — 沿用急診常見班別語彙）
- **講師可手動調整分組**（有人請假、人數奇數）

---

## 7. P1-2：前後測

- 同樣 3 題，課首（`pretest`）、課尾（`posttest`）各一次
- 題目**不揭曉答案**（前測揭曉會污染後測）
- `compare` phase：投影幕顯示三題的前後答案分佈並列 + 全班答對率變化
- 匯出：`GET /api/room/:code/export` 回傳完整 JSON（含個人層級前後測），供講師課後分析

**隱私**：學員填的是自訂代號不是真名，匯出檔僅含代號。若日後要作教學研究用途，需另行處理知情同意，系統端不預設收集可識別資料。

---

## 8. 三個畫面（沿用既有架構）

| 畫面 | 路徑 | 新增需求 |
|---|---|---|
| 講師控制台 | `/host` | 三段式按鈕、分歧提示、手動加減分、籌碼銀行、手動調整分組、跳關、`idle` 切換 |
| 投影幕 | `/screen?room=` | 大字、無控制項、分佈長條圖、籌碼餘額列、結果三行、前後測對照頁 |
| 學員手機 | `/play?room=` | **題幹文字不放手機**（僅放選項與必要的簡短提示）；等待狀態要有明確文案 |

**手機只是輸入裝置**——這條規則寫進 code review checklist，任何把完整 vignette 塞進手機的實作都要退回。

---

## 9. 降級路徑（硬性需求）

1. 控制台有 **手動模式**：無人連線時仍可當純計分板使用（手動加減分、手動翻頁）
2. 任何 phase 皆可由控制台 **跳關**，不得出現「卡住只能重開房間」
3. 學員端斷線自動重連，重連後回到當前 phase
4. 房間狀態每次變更寫入 DO storage，Worker 重啟不遺失

---

## 10. 內容與程式分離

所有題目、案例、解析、依據條文集中於 `content.json`，程式不得硬編任何臨床內容。
講師日後換題只改 JSON。schema 見該檔頂層 `$schema_note`。

---

## 11. 建議實作順序

1. `content.json` 載入層 + schema 驗證
2. P0-1 三段式機制（先套用到既有 Part 1 題庫，立刻可用）
3. `idle` phase + 手動模式 + 跳關（降級路徑先做，之後開發才敢動）
4. Part 2 demo → faded → solo
5. 三級結果引擎 + 分歧點回放
6. 前後測 + compare 頁
7. Part 3 五岔路口
8. 匯出 API

**里程碑檢查點**：完成 2 + 3 後就應該能跑一場「只有 Part 1」的完整課，先上線驗證再往下做。
