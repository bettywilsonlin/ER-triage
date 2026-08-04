# TTAS 檢傷遊戲

台灣急診五級檢傷（TTAS）課堂互動遊戲。講師電腦投影主畫面，學員手機掃 QR code 作答。
Round 1 快問快答（12 題）+ Round 2「檢傷站的一小時」模擬（10 位病人，含惡化事件與急救床機制）。

技術：Cloudflare Workers + Durable Objects（WebSocket 即時同步），免費方案即可，零成本。

## 部署（一次性設定）

1. 安裝 Node.js ≥ 18
2. `npm install`
3. `npx wrangler login`（開瀏覽器登入 Cloudflare 帳號，免費註冊即可）
4. `npx wrangler deploy`
5. 部署完成後會顯示網址，例如 `https://ttas-triage-game.<你的子網域>.workers.dev`

之後改題目或參數，重新執行 `npx wrangler deploy` 即可。

## 上課使用

1. 講師開 `https://<網址>/host` 並投影——會自動產生房號與 QR code
2. 學員手機掃 QR、輸入暱稱加入
3. 講師按「開始 Round 1」；每題全員作答完會自動揭曉（也可提前揭曉），按「下一題」前進
4. Round 1 結束後按「開始 Round 2」，病人自動依序抵達，系統自動計時與揭曉
5. 下一堂課直接重新開 `/host`（新房號）即可，或按「重設本場」清空同一房間

同一時間可以開多個房間（不同 `?room=` 各自獨立），互不干擾。

## 遊戲規則摘要

- Quiz：答對 +100，速度加成最多 +50
- 模擬：級數正確 +100；差一級 +40；under-triage 差 ≥2 級 0 分，且該病人會在 2 位病人後於候診區「惡化」（肇事者 −50，投影全場公告）
- Over-triage（把 ≥3 級分成 1-2 級）−20，並佔用急救床（每人 2 床、佔 3 位病人的時間）；床滿仍 over-triage 再 −30
- 正確分 1-2 級不會因床滿被罰——床機制只懲罰浪費資源，不懲罰正確判斷
- 未作答視同漏掉病人；漏掉 1-2 級病人同樣觸發惡化

## 修改題目與參數

全部集中在 `src/questions.js`：

- `QUIZ`：快問快答題目（`kind: "level"` 選 1-5 級；`kind: "choice"` 自訂選項）
- `PATIENTS`：模擬病人（vignette、vitals、正解、惡化事件文字）
- `CONFIG`：秒數、病人間隔、急救床數等
- `SCORING`:各項分數

## 專案結構

```
src/index.js      Worker + GameRoom Durable Object（遊戲伺服器）
src/questions.js  題庫與參數
public/index.html 學員手機端
public/host.html  講師投影端
wrangler.jsonc    Cloudflare 設定
```

## 已通過的整合測試

模擬 1 講師 + 3 學員完整跑完兩輪：quiz 12 題計分與揭曉、全員作答自動揭曉、
模擬 10 位病人依序抵達、under-triage 觸發 6 起惡化事件、over-triage 佔床與無床懲罰、
正確檢傷不因床滿受罰、重設功能。
