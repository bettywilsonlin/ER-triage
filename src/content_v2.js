// 由 course/content/content_v2.json 生成，勿手改；改內容改 JSON 後重跑生成
export const CONTENT_V2 = {
  "$schema_note": "PGY1 急診互動遊戲內容檔 v2。程式不得硬編臨床內容，一律讀此檔。part1 沿用既有題庫 v1.1（quiz 12 + 模擬病人 10），本檔不重複收錄，僅以 part1_ref 標記。臨床數值為教學設定值，實際臨床請依現行指引。",
  "version": "2.0",
  "locale": "zh-TW",

  "teamNames": ["紅班", "藍班", "綠班", "黃班"],

  "part1_ref": {
    "source": "既有題庫 v1.1",
    "repo": "https://github.com/bettywilsonlin/er-triage",
    "location": "src/questions.js（QUIZ 12 題 + PATIENTS 10 位；CONFIG／SCORING 參數）",
    "note": "10 位模擬病人 + 12 題 quiz，答案依據衛福部「急診五級檢傷分類基準—修正版」與衛福部醫事司提供之五級例舉。本次僅套用新的三段式 commit/distribution/reveal 機制，題目內容不變。實際題目內容維護於上述 repo，不在本檔重複收錄。"
  },

  "prepost": {
    "instruction": "課首與課尾各作答一次，前測不揭曉答案。",
    "items": [
      {
        "id": "pp01",
        "stem": "58 歲男性走進急診，主訴胸痛 30 分鐘。你腦中第一個要回答的問題是什麼？",
        "options": [
          { "key": "A", "text": "最可能的診斷是什麼？" },
          { "key": "B", "text": "他會不會死？現在需不需要處理？" },
          { "key": "C", "text": "要收哪一科？" },
          { "key": "D", "text": "他的過去病史有哪些？" }
        ],
        "answer": "B",
        "concept": "problem-based thinking：急診的第一問是 acuity 不是 diagnosis",
        "rationale": "EM Model 的臨床實務架構以 patient acuity 為第一維度；病人帶著 signs and symptoms 而非診斷來到急診。"
      },
      {
        "id": "pp02",
        "stem": "一位病人的某疾病驗前機率只有 2%，你做了一個 LR+ 約 5 的檢查，結果是陽性。此時該疾病的機率最接近：",
        "options": [
          { "key": "A", "text": "約 10%" },
          { "key": "B", "text": "約 50%" },
          { "key": "C", "text": "約 80%" },
          { "key": "D", "text": "接近 100%，陽性就是有病" }
        ],
        "answer": "A",
        "concept": "檢查是更新機率的工具，不是產生答案的魔法",
        "rationale": "驗前 2% 經 LR+ 5 後約為 9%。驗前機率夠低時，陽性結果主要製造後續檢查與焦慮。數值為教學設定值。"
      },
      {
        "id": "pp03",
        "stem": "急診醫師處理每一位病人時，最後**一定**要回答、而病房主治醫師不需要每天回答的問題是：",
        "options": [
          { "key": "A", "text": "這個病人的完整鑑別診斷清單" },
          { "key": "B", "text": "這個病人接下來去哪裡（disposition）" },
          { "key": "C", "text": "這個病人的長期預後" },
          { "key": "D", "text": "這個病人要用什麼抗生素" }
        ],
        "answer": "B",
        "concept": "disposition 是急診的核心產出",
        "rationale": "EM Model physician task 之 Transitions of care：安排住院、出院（含追蹤計畫）、觀察或轉院，並與病人、家屬、團隊有效溝通。"
      }
    ]
  },

  "part2": {
    "title": "我是急診醫師：從穩定到找原因",
    "designNote": "三題遞進（worked example → faded guidance → independent），對應認知負荷理論之 worked example effect。示範題不計分，半引導題每步 40 秒，獨立題 120 秒團隊作答。",

    "demo": {
      "id": "p2_demo",
      "mode": "instructor_walkthrough",
      "title": "示範題：講師 think-aloud",
      "vitalsHeader": "76 歲女性，由家人送入。三天發燒、食慾差，今天叫不太醒。",
      "vitals": {
        "BP": "82/48 mmHg",
        "HR": "124 bpm",
        "RR": "26 /min",
        "SpO2": "94% (room air)",
        "Temp": "39.2°C (耳溫)",
        "GCS": "E3V4M6 = 13",
        "Glucose": "156 mg/dL"
      },
      "steps": [
        {
          "step": "A",
          "screen": "Airway：病人會呻吟、可自行清痰",
          "expertAction": "呼吸道通暢，暫不介入，但持續監測意識",
          "thinkAloud": "我看她會出聲、能咳，代表 airway 是通的。但 GCS 13 而且還在掉的話，等一下可能就要保護呼吸道 — 所以我不是『打勾就走』，我是『先放行、但留意』。"
        },
        {
          "step": "B",
          "screen": "Breathing：呼吸稍快，兩下肺輕微囉音，SpO2 94%",
          "expertAction": "給氧維持 SpO2 ≥ 94%，接上連續監測",
          "thinkAloud": "94% 不算太差，但她在休克邊緣，組織缺氧的空間很小。我會先給氧 — 這是低成本、可逆、可能有用的介入，符合急診『先穩定』的原則。"
        },
        {
          "step": "C",
          "screen": "Circulation：四肢溫、脈搏快而弱、CRT 3 秒",
          "expertAction": "兩條大孔徑 IV、抽血含 lactate 與血液培養、開始輸液復甦、上 monitor",
          "thinkAloud": "這是我今天最緊急的一步。血壓 82/48、心跳 124、發燒 — 這是 sepsis 到 septic shock 的樣子。注意我抽血培養在給抗生素之前，但我不會為了等培養而延誤抗生素。"
        },
        {
          "step": "D",
          "screen": "Disability：GCS 13，瞳孔等大反應正常，血糖 156",
          "expertAction": "血糖已測排除低血糖，意識改變暫歸因於灌流不足與感染",
          "thinkAloud": "意識改變我一定先驗血糖 — 這是最便宜、最快、漏掉最可惜的一項。血糖正常，那她的意識改變比較可能是灌流問題，這反而支持我趕快把血壓拉起來。"
        },
        {
          "step": "E",
          "screen": "Exposure：脫衣檢查，發現薦骨部位壓瘡有惡臭滲液",
          "expertAction": "找到感染源，早期給予抗生素，照會相關科別",
          "thinkAloud": "這就是為什麼 E 不能跳過。沒有翻身脫衣，這個壓瘡永遠找不到。急診很多致命線索藏在衣服底下。"
        }
      ],
      "closing": "整段的順序是：先穩定（ABC）→ 再找原因（E 找到感染源）。這就是 primary survey 先於 secondary survey 的意義。"
    },

    "faded": {
      "id": "p2_faded",
      "mode": "stepwise_mcq",
      "title": "半引導題：一步一步做",
      "secondsPerStep": 40,
      "vitalsHeader": "55 歲男性，機車自撞電線桿後送入。主訴胸痛、非常喘。",
      "vitals": {
        "BP": "88/60 mmHg",
        "HR": "132 bpm",
        "RR": "34 /min",
        "SpO2": "86% (room air)",
        "GCS": "E4V5M6 = 15",
        "其他": "頸靜脈怒張，左側呼吸音明顯減弱，氣管稍偏右"
      },
      "steps": [
        {
          "step": "A",
          "prompt": "Airway 這一步你要做什麼？",
          "options": [
            { "key": "A", "text": "病人可完整說話，呼吸道通暢；因外傷機轉維持頸椎保護", "correct": true },
            { "key": "B", "text": "立即插管" },
            { "key": "C", "text": "放置口咽人工呼吸道" },
            { "key": "D", "text": "跳過，先看 X 光" }
          ],
          "explain": "能完整說話代表呼吸道當下通暢。外傷病人在 A 這一步同時要做頸椎保護。此時插管非首要，且未先處理胸腔問題就插管可能使情況惡化。"
        },
        {
          "step": "B",
          "prompt": "SpO2 86%、左側呼吸音減弱、頸靜脈怒張、氣管偏移 — 這一步做什麼？",
          "options": [
            { "key": "A", "text": "先安排胸部 X 光確認診斷再處理" },
            { "key": "B", "text": "高流量給氧，並立即針對疑似張力性氣胸做減壓", "correct": true },
            { "key": "C", "text": "給氧後觀察 10 分鐘再評估" },
            { "key": "D", "text": "先做 12-lead ECG 排除心肌梗塞" }
          ],
          "explain": "張力性氣胸是臨床診斷、需立即處置的狀況，等影像會延誤。這一題就是『treatment before diagnosis』最典型的例子。"
        },
        {
          "step": "C",
          "prompt": "減壓後 SpO2 上升至 95%，血壓 96/64。Circulation 這一步？",
          "options": [
            { "key": "A", "text": "兩條大孔徑 IV、上 monitor、評估其他出血來源（含 FAST）", "correct": true },
            { "key": "B", "text": "血壓已改善，不需再處理循環" },
            { "key": "C", "text": "立即給予升壓劑" },
            { "key": "D", "text": "先送去做全身 CT" }
          ],
          "explain": "外傷低血壓在未排除出血前不應直接靠升壓劑。此時建立管路、監測、尋找出血來源（腹腔、骨盆、胸腔、長骨、體外）才是正解。未穩定的病人不應離開急診去做 CT。"
        },
        {
          "step": "D",
          "prompt": "Disability 這一步？",
          "options": [
            { "key": "A", "text": "評估 GCS、瞳孔，並測血糖", "correct": true },
            { "key": "B", "text": "GCS 15 就可以跳過" },
            { "key": "C", "text": "立即給予止痛與鎮靜劑" },
            { "key": "D", "text": "安排腦部 CT" }
          ],
          "explain": "GCS 15 仍要記錄基準值並測血糖，之後任何變化才有比較基礎。D 的重點是建立 baseline，不是只有『有沒有昏迷』。"
        },
        {
          "step": "E",
          "prompt": "Exposure 這一步？",
          "options": [
            { "key": "A", "text": "完整脫衣翻身檢查全身，同時保暖避免低體溫", "correct": true },
            { "key": "B", "text": "只檢查胸部即可" },
            { "key": "C", "text": "脫衣檢查，房間開冷氣讓病人舒服" },
            { "key": "D", "text": "等家屬到再脫衣" }
          ],
          "explain": "E 是 expose 也是 environment：要看得到，也要防止低體溫。外傷病人低體溫會加重凝血功能異常。"
        }
      ]
    },

    "solo": {
      "id": "p2_solo",
      "mode": "ordering",
      "title": "獨立題：排出你的前四個動作",
      "seconds": 120,
      "answerBy": "team",
      "vitalsHeader": "25 歲女性，室友發現叫不醒送來。近兩週體重下降、一直喊口渴。",
      "vitals": {
        "BP": "96/58 mmHg",
        "HR": "126 bpm",
        "RR": "32 /min（深而快）",
        "SpO2": "99% (room air)",
        "Temp": "36.8°C",
        "GCS": "E3V4M5 = 12",
        "其他": "口腔黏膜乾燥，呼氣有水果味"
      },
      "actionPool": [
        { "id": "a1", "text": "評估呼吸道通暢並給氧" },
        { "id": "a2", "text": "床邊血糖檢測" },
        { "id": "a3", "text": "建立靜脈通路並開始輸液復甦" },
        { "id": "a4", "text": "抽血檢驗（含電解質、血氣、酮體）" },
        { "id": "a5", "text": "立即靜脈注射高濃度葡萄糖" },
        { "id": "a6", "text": "安排腦部 CT" },
        { "id": "a7", "text": "立即給予大劑量鎮靜劑控制躁動" },
        { "id": "a8", "text": "上連續生命徵象監測" }
      ],
      "outcomeRule": {
        "criticalActions": ["a1", "a2", "a3", "a8"],
        "timeSensitive": [
          { "action": "a2", "mustBeWithinTop": 2, "reason": "意識改變必須極早排除低血糖" }
        ],
        "fatalOmissions": ["a2", "a3"],
        "harmfulActions": ["a5", "a7"],
        "causalExplanation": {
          "a2": "漏掉床邊血糖：意識改變的病人若為低血糖而未偵測，將延誤唯一能立刻逆轉的病因。血糖是最便宜、最快、漏掉代價最高的一項檢查。",
          "a3": "漏掉輸液復甦：此病人處於嚴重脫水合併循環不穩（HR 126、BP 96/58、黏膜乾燥），未及早輸液會進展為休克。",
          "a5": "未驗血糖就直接推高濃度葡萄糖：此病人臨床上高度懷疑高血糖狀態，盲目給糖會使病況急遽惡化。這一題考的是『先測再治』。",
          "a6": "先安排腦部 CT：把未穩定的病人送離急診做影像，是急診常見且危險的錯誤。CT 不會改變你此刻該做的事。",
          "a7": "大劑量鎮靜：意識改變的原因未釐清前給鎮靜，會掩蓋病情變化並可能危及呼吸道。"
        }
      },
      "expertPath": ["a1", "a2", "a3", "a8"],
      "diagnosis": "糖尿病酮酸血症（DKA）",
      "debriefPoint": "重點不在『猜對 DKA』，而在於：意識改變 → 先驗血糖；循環不穩 → 先輸液。診斷是在穩定之後才浮現的。"
    }
  },

  "part3": {
    "title": "整合案例：一個病人，五個岔路口",
    "designNote": "每個岔路走完整三段式（個人 commit → 組內討論 60 秒 → 組別提交 → 分佈 → 討論 → 揭曉）。岔路 3、4 消耗籌碼。",
    "patient": {
      "header": "78 歲男性，由長照機構人員送來。主訴：今天整天『怪怪的』、叫不太應、下午開始發燒。",
      "background": "有高血壓、輕度失智，平時可自行進食、扶著助行器行走。長期臥床否認。近三天有咳嗽。",
      "arrivalVitals": {
        "BP": "94/56 mmHg",
        "HR": "116 bpm",
        "RR": "28 /min",
        "SpO2": "90% (room air)",
        "Temp": "38.8°C",
        "GCS": "E3V4M6 = 13（機構人員表示平時 15、對答清楚）"
      }
    },
    "junctions": [
      {
        "id": "j1",
        "title": "岔路一：檢傷級數",
        "prompt": "你是檢傷護理師，這位病人應該給幾級？",
        "options": [
          { "key": "1", "text": "一級（復甦急救）" },
          { "key": "2", "text": "二級（危急）", "correct": true },
          { "key": "3", "text": "三級（緊急）" },
          { "key": "4", "text": "四級（次緊急）" },
          { "key": "5", "text": "五級（非緊急）" }
        ],
        "tokenCost": 0,
        "explain": "急性意識狀態改變屬二級例舉；且發燒的分級不看絕對值，而看病容與免疫狀態 — 此病人臉色差、心跳快、意識由 15 掉到 13，屬有病容。生命徵象未至需立即復甦的程度，故非一級。",
        "source": "衛福部「急診五級檢傷分類基準—修正版」首要調節變數（意識、體溫）與衛福部醫事司五級例舉",
        "linkBack": "連回 Part 1：你剛剛練的檢傷，在真實病人身上就是這樣用的。"
      },
      {
        "id": "j2",
        "title": "岔路二：Primary survey 後的第一優先",
        "prompt": "病人進到診療區，你做完 ABCDE。下一步最優先做什麼？",
        "options": [
          { "key": "A", "text": "給氧、建立兩條靜脈通路、開始輸液，同時抽血含血液培養與 lactate", "correct": true },
          { "key": "B", "text": "先安排胸部 X 光與腦部 CT 確認診斷" },
          { "key": "C", "text": "先聯絡家屬討論急救意願再處理" },
          { "key": "D", "text": "先給退燒藥觀察退燒後意識是否改善" }
        ],
        "tokenCost": 0,
        "explain": "SpO2 90%、BP 94/56、HR 116 加上發燒與意識改變 — 這是敗血症合併灌流不足的樣子。先穩定（給氧、輸液、建立管路）再找原因，這是 primary → secondary survey 的順序。影像可以稍後做，但缺氧與低灌流不能等。家屬討論非常重要，但不取代當下的穩定處置。",
        "linkBack": "連回 Part 2：跟你剛剛練的順序完全一樣。"
      },
      {
        "id": "j3",
        "title": "岔路三：你要下哪些檢查？（每項 1 枚籌碼）",
        "prompt": "組內討論後，選出你要下的檢查（可複選）。每選一項扣 1 枚籌碼。",
        "multiSelect": true,
        "tokenCostPerSelection": 1,
        "options": [
          { "key": "A", "text": "胸部 X 光", "value": "high", "comment": "有咳嗽 + 缺氧 + 發燒，驗前機率高，且結果會直接改變抗生素選擇與 disposition" },
          { "key": "B", "text": "血液培養（給抗生素前）", "value": "high", "comment": "會影響後續抗生素調整，且時機不可逆 — 錯過就採不到了" },
          { "key": "C", "text": "尿液常規與尿液培養", "value": "high", "comment": "老年人意識改變常見感染源，成本低、驗前機率高" },
          { "key": "D", "text": "靜脈血氣與 lactate", "value": "high", "comment": "評估組織灌流與嚴重度，直接影響復甦強度" },
          { "key": "E", "text": "腦部 CT", "value": "medium", "comment": "意識改變需考慮，但此病人有明確感染徵象且無局部神經學缺損、無外傷史 — 可先穩定後再視反應決定。不是錯，但不是第一批" },
          { "key": "F", "text": "全身電腦斷層（頭到骨盆）", "value": "low", "comment": "無外傷機轉、無此適應症。典型的『撒網式檢查』，成本高、假陽性多、且要把不穩定病人送離急診" },
          { "key": "G", "text": "腫瘤標記全套", "value": "low", "comment": "與當下 problem 完全無關，不會改變任何處置" },
          { "key": "H", "text": "心臟超音波（正式檢查排程）", "value": "low", "comment": "此刻不影響處置；若需評估容積狀態，床邊 POCUS 更即時" }
        ],
        "scoring": {
          "highValueSelected": 2,
          "lowValueSelected": -2,
          "note": "評分關鍵不是選最多，而是每一項都能回答『這個結果會改變我的處置或 disposition 嗎？』"
        },
        "linkBack": "連回機率思維與資源講課：檢查是更新機率的工具，不是安全感的來源。"
      },
      {
        "id": "j4",
        "title": "岔路四：Disposition",
        "prompt": "輸液 1 小時後 BP 108/64、HR 98、SpO2 96%（鼻導管 3L），意識回到 E4V5M6。胸部 X 光顯示右下肺浸潤。這個病人去哪裡？",
        "options": [
          { "key": "A", "text": "出院，門診追蹤，口服抗生素" },
          { "key": "B", "text": "留觀 4 小時後再決定" },
          { "key": "C", "text": "住院（一般病房），靜脈抗生素", "correct": true },
          { "key": "D", "text": "轉送醫學中心" }
        ],
        "tokenCost": 1,
        "explain": "年齡、缺氧需氧氣支持、意識曾改變、機構住民 — 都指向住院。對輸液有反應、目前不需升壓劑，尚不需加護病房，但不能出院。轉院無適應症（本院可處理）。留觀只是延後決定，且會佔用急診資源。",
        "extraCredit": "若學員主動提及：需與家屬討論治療目標與急救意願（DNR/ACP），額外 +2。這是老年重症 disposition 中真實且經常被漏掉的一步。",
        "linkBack": "連回 disposition 講課：四種去向你剛剛都考慮過一輪了。"
      },
      {
        "id": "j5",
        "title": "岔路五：ISBAR 照會",
        "prompt": "組內推派一人，用 ISBAR 向內科值班醫師照會這位病人（口頭，60 秒）。",
        "mode": "verbal_manual_scoring",
        "rubric": [
          { "item": "I — 表明自己身分與照會對象", "points": 1 },
          { "item": "S — 一句話說清楚現在的問題", "points": 1 },
          { "item": "B — 相關背景（年齡、機構、病史、病程）", "points": 1 },
          { "item": "A — 你的評估（含已做的處置與反應）", "points": 1 },
          { "item": "R — 明確的建議與請求（要對方做什麼、何時）", "points": 2 }
        ],
        "modelAnswer": "我是急診 PGY 某某，想跟您照會一位病人。78 歲男性，長照機構住民，右下肺炎併敗血症，需要住院。他今天意識改變加發燒來院，到院時血壓 94/56、SpO2 90%、GCS 13。我們已經給氧、輸液 1000 mL，血壓回到 108/64、意識恢復到平時狀態，血液培養已採、抗生素已給，胸部 X 光顯示右下肺浸潤。想請您收治一般病房，並請您現在方便的時候過來看一下，家屬等一下會到，也想一起討論治療目標。",
        "linkBack": "連回團隊溝通講課：R 沒講清楚，前面四項都白費。"
      }
    ],
    "epilogue": {
      "title": "72 小時後",
      "content": "病人住院後抗生素治療反應良好，第三天氧氣脫離、意識回到平時狀態。家庭會議中確認治療目標，病人與家屬簽署 DNR，第五天返回機構。",
      "counterfactual": [
        { "ifChoice": "j4=A（出院）", "outcome": "回機構當晚呼吸窘迫加劇，隔日再次送醫時已需插管。" },
        { "ifChoice": "j3 未選 B（未在給抗生素前採血液培養）", "outcome": "第三天培養無菌落生長，抗生素無法降階，療程延長且住院天數增加。" },
        { "ifChoice": "j3 選了 F（全身 CT）", "outcome": "病人在 CT 室期間血壓下降無人即時發現；另發現一顆意義不明的肺結節，導致後續三個月反覆追蹤與焦慮。" }
      ],
      "closingSlide": "急診做的每一個決定，影響的不只是這兩個小時。"
    }
  },

  "part3_board": {
    "$note": "v3 進階版（ED board 多病人 + 遊戲時鐘 + OHCA 插入事件）預留欄位，本次不實作。",
    "clockCompressionRatio": null,
    "patients": [],
    "interruptEvents": []
  },

  "sources": {
    "triage": "衛生福利部「急診五級檢傷分類基準—修正版」https://www.mohw.gov.tw/dl-66174-ff4e5da2-ddc5-4f07-9f37-67434e5a1177.html；衛福部醫事司提供之檢傷分類五級例舉（健保署刊載）https://www.nhi.gov.tw/ch/cp-2655-9ad69-2950-1.html",
    "emModel": "The 2022 Model of the Clinical Practice of Emergency Medicine, J Emerg Med 2023. https://www.abem.org/wp-content/uploads/2024/07/2022-EM-Model-for-Website.pdf",
    "abcde": "Thim T, et al. Int J Gen Med. 2012;5:117-121；ATLS 10th ed.",
    "probability": "Fagan TJ. NEJM 1975;293:257；McGee S. J Gen Intern Med 2002;17:646-649",
    "verificationNote": "檢傷與 EM Model 來源已直接讀取原文。ABCDE 與機率思維之書目為既有知識引用，未逐筆核對卷期頁碼；臨床處置內容為教學設計，非臨床指引，實際臨床請依現行指引與院內規範。"
  }
}
;
