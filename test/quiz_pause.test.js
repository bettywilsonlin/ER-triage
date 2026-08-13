// classic Round 1「分佈停頓」測試（把 course 的 Kolb 停頓併進 classic 的一顆按鈕）。
// 新行為：作答 → 顯示分佈（答案蓋著、不計分）→ 揭曉答案（計分）→ 下一題。
// 對照舊行為：Round 1 原本是「作答 → 一次揭曉（答案＋計分同時出現）」。
import { env, runInDurableObject } from "cloudflare:test";
import { it, expect } from "vitest";
import { QUIZ, SCORING } from "../src/questions.js";

const room = n => env.ROOMS.get(env.ROOMS.idFromName(n));

it("Round 1 三段式：QUIZ → QUIZ_DIST（不含答案、不計分）→ QUIZ_REVEAL（含答案＋計分）", async () => {
  await runInDurableObject(room("qp1"), async (I) => {
    I.s.players["小明"] = I.newPlayer();
    await I.nextQuiz();                       // LOBBY → QUIZ
    expect(I.s.phase).toBe("quiz");

    const q = QUIZ[0];                         // level-kind, ans:1
    I.s.answers["小明"] = { v: q.ans, at: I.s.deadline - 1000 };  // 答對、快答

    const dist = await I.quizShowDist();       // QUIZ → QUIZ_DIST
    expect(I.s.phase).toBe("quiz_dist");
    expect(dist).not.toHaveProperty("ans");    // 停頓階段：答案／解析／依據都不可外洩
    expect(dist).not.toHaveProperty("explain");
    expect(dist).not.toHaveProperty("src");
    expect(dist.dist[q.ans - 1]).toBe(1);      // level-kind：idx = v-1
    expect(I.s.players["小明"].score).toBe(0); // 停頓階段還沒計分

    await I.revealQuiz();                       // QUIZ_DIST → QUIZ_REVEAL
    expect(I.s.phase).toBe("quiz_reveal");
    expect(I.s.players["小明"].score).toBeGreaterThan(SCORING.quizBase);  // 揭曉才計分
    expect(I.s.players["小明"].stats.qCorrect).toBe(1);
  });
});

it("Round 1 計時器時間到，落在『顯示分佈』而不是直接揭曉答案", async () => {
  await runInDurableObject(room("qp2"), async (I) => {
    I.s.players["小華"] = I.newPlayer();
    await I.nextQuiz();
    I.s.answers["小華"] = { v: QUIZ[0].ans, at: I.s.deadline - 1000 };

    await I.alarm();                            // 計時引擎在 QUIZ 相位觸發
    expect(I.s.phase).toBe("quiz_dist");        // 應停在分佈，不是 quiz_reveal
    expect(I.s.players["小華"].score).toBe(0);  // 尚未計分
  });
});

it("Round 1（choice-kind）：分佈用原始索引、揭曉正確計分", async () => {
  await runInDurableObject(room("qp3"), async (I) => {
    I.s.players["C"] = I.newPlayer();
    await I.nextQuiz();
    // 移到第一個 choice 題（QUIZ[3]，ans:2、4 選項）
    I.s.qi = 3;
    I.s.phase = "quiz";
    I.s.answers = {};
    I.s.deadline = Date.now() + 10000;
    I.s.answers["C"] = { v: 2, at: I.s.deadline - 1000 };  // 正解

    const dist = await I.quizShowDist();
    expect(dist.dist[2]).toBe(1);              // choice 用原始索引 a.v（不減一）
    expect(dist.dist).toHaveLength(4);
    expect(dist).not.toHaveProperty("ans");

    await I.revealQuiz();
    expect(I.s.phase).toBe("quiz_reveal");
    expect(I.s.players["C"].score).toBeGreaterThan(0);
    expect(I.s.players["C"].stats.qCorrect).toBe(1);
  });
});
