// Task 2.1：course 模式三段式 phase 機（commit → show-distribution → reveal）測試。
// 目的：
//   1. 三段式必須是三個獨立步驟（startCourse / courseShowDist / courseReveal），
//      分佈階段（course_dist）的 payload 絕不可外洩答案/解析（Kolb 停頓）。
//   2. course 流程跑完後，classic 的 nextQuiz 仍完好可用（v1 零改動的驗收）。
import { env, runInDurableObject } from "cloudflare:test";
import { it, expect } from "vitest";

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
