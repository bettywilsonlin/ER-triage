// Task 2.1：course 模式三段式 phase 機（commit → show-distribution → reveal）測試。
// 目的：
//   1. 三段式必須是三個獨立步驟（startCourse / courseShowDist / courseReveal），
//      分佈階段（course_dist）的 payload 絕不可外洩答案/解析（Kolb 停頓）。
//   2. course 流程跑完後，classic 的 nextQuiz 仍完好可用（v1 零改動的驗收）。
import { env, runInDurableObject } from "cloudflare:test";
import { it, expect } from "vitest";
import { QUIZ } from "../src/questions.js";

const room = n => env.ROOMS.get(env.ROOMS.idFromName(n));

it("course 三段式：Q → DIST（不含答案）→ REVEAL（含答案）", async () => {
  await runInDurableObject(room("c1"), async (I) => {
    I.s.players["A"] = I.newPlayer();
    await I.startCourse();                 // → COURSE_Q, ci=0
    expect(I.s.phase).toBe("course_q");
    I.s.answers["A"] = { v: 1, at: Date.now() };
    const dist = await I.courseShowDist();  // → COURSE_DIST，回傳的 payload
    expect(I.s.phase).toBe("course_dist");
    expect(dist).not.toHaveProperty("ans");        // 分佈階段禁止外洩答案
    expect(dist).not.toHaveProperty("explain");
    expect(dist).not.toHaveProperty("src");        // 三者（ans/explain/src）都不可外洩
    const rev = await I.courseReveal();     // → COURSE_REVEAL
    expect(I.s.phase).toBe("course_reveal");
    expect(rev).toHaveProperty("ans");             // 揭曉才有答案
  });
});

it("course 不改動 classic：跑完 course 後仍能開 classic quiz", async () => {
  await runInDurableObject(room("c2"), async (I) => {
    await I.startCourse(); await I.courseShowDist(); await I.courseReveal();
    I.s = I.freshState();                    // 重設
    await I.nextQuiz();
    expect(I.s.phase).toBe("quiz");          // classic 完好
  });
});

// 補測（收 2.1 review Minor）：choice-kind 從未被跑到——既有測試用的 QUIZ[0] 是 level-kind（ans:1），
// dist 索引算法依題型分支（choice 用 idx = a.v；level 用 idx = a.v-1），choice 那支需要獨立驗證。
// 第一個 choice 題是 QUIZ[3]（kind:"choice", ans:2, 4 個選項）。
it("course 三段式（choice-kind）：dist 用原始索引、reveal 正確計分", async () => {
  await runInDurableObject(room("c3"), async (I) => {
    I.s.players["C"] = I.newPlayer();
    await I.startCourse();
    // 直接把狀態移到 choice 題（QUIZ[3]），不重跑 startCourse 的 level 題
    I.s.ci = 3;
    I.s.phase = "course_q";
    I.s.answers = {};
    I.s.deadline = Date.now() + 10000;

    I.s.answers["C"] = { v: 2, at: I.s.deadline - 1000 };  // QUIZ[3].ans = 2（正解）
    const dist = await I.courseShowDist();
    expect(I.s.phase).toBe("course_dist");
    expect(dist.dist[2]).toBe(1);            // choice 用原始索引 a.v（不減一）
    expect(dist).not.toHaveProperty("ans");        // 分佈階段禁止外洩答案
    expect(dist).not.toHaveProperty("explain");
    expect(dist).not.toHaveProperty("src");

    const rev = await I.courseReveal();
    expect(I.s.phase).toBe("course_reveal");
    expect(rev.ans).toBe(2);
    expect(I.s.players["C"].score).toBeGreaterThan(0);     // 答對應計分
    expect(I.s.players["C"].stats.qCorrect).toBe(1);
  });
});

// 補測（收 2.1 review Minor）：courseNextQ 在最後一題後應收尾到 COURSE_END，此路徑之前未測到。
it("courseNextQ：最後一題 reveal 後前進應收尾到 COURSE_END", async () => {
  await runInDurableObject(room("c4"), async (I) => {
    await I.startCourse();
    I.s.ci = QUIZ.length - 1;    // 驅動到最後一題
    I.s.phase = "course_reveal";
    await I.courseNextQ();
    expect(I.s.phase).toBe("course_end");
  });
});
