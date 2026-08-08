// v1 classic 玩法回歸測試護欄。
// 目的：鎖住「現有」行為（quiz 計分/phase 轉移、sim under-triage 惡化機制），
// 讓之後任何 Task 改動 src/index.js 或 src/questions.js 時，只要動到這三件事就會變紅。
// 這三個測試對照的是「已存在、未經修改」的 v1 程式碼，跑起來本來就是綠燈——
// 綠燈本身就是護欄生效的證據，不是刻意先紅後綠的 TDD 流程。
import { env, runInDurableObject } from "cloudflare:test";
import { it, expect } from "vitest";
import { QUIZ, SCORING } from "../src/questions.js";

// 取得一個房間 DO stub（每個測試用不同房名，避免 DO 狀態互相污染）
function room(name) {
  const id = env.ROOMS.idFromName(name);
  return env.ROOMS.get(id);
}

it("classic quiz：答對計分 = base(100) + 速度加成(>100)，且 phase 依序 LOBBY→QUIZ→QUIZ_REVEAL", async () => {
  const stub = room("quiz1");
  await runInDurableObject(stub, async (instance) => {
    expect(instance.s.phase).toBe("lobby");

    instance.s.players["小明"] = instance.newPlayer();
    await instance.nextQuiz(); // LOBBY → QUIZ，qi: -1 → 0
    expect(instance.s.phase).toBe("quiz");

    const q = QUIZ[0];
    // 快答：deadline 前 1 秒送出，應拿到 >0 的速度加成
    instance.s.answers["小明"] = { v: q.ans, at: instance.s.deadline - 1000 };
    await instance.revealQuiz(); // QUIZ → QUIZ_REVEAL
    expect(instance.s.phase).toBe("quiz_reveal");

    const score = instance.s.players["小明"].score;
    expect(score).toBeGreaterThan(SCORING.quizBase); // base(100) + 速度加成 > 100
    expect(instance.s.players["小明"].stats.qCorrect).toBe(1);
  });
});

it("classic sim：under-triage ≥2 級先排程惡化、延遲 detDelayPatients 位病人後才真正扣分", async () => {
  const stub = room("sim1");
  await runInDurableObject(stub, async (instance) => {
    instance.s.players["小華"] = instance.newPlayer();

    await instance.startSim(); // → SIM_WAIT
    await instance.arrivePatient(); // SIM_WAIT → SIM，pi=0（PATIENTS[0]：ans=1，det 非 null）
    expect(instance.s.phase).toBe("sim");

    // v=3 對正解 1 級 → diff = 3-1 = 2（under-triage ≥2 級）
    instance.s.answers["小華"] = { v: 3, at: Date.now() };
    await instance.revealPatient(); // SIM → SIM_WAIT；此刻只排程惡化，不會立即扣分

    expect(instance.s.pendingDet.length).toBeGreaterThan(0);
    expect(instance.s.pendingDet[0].victims).toContain("小華");
    // 延遲觸發：revealPatient 當下 stats.det 與 score 都還沒被惡化事件影響
    expect(instance.s.players["小華"].stats.det).toBe(0);
    expect(instance.s.players["小華"].score).toBe(0);

    await instance.endSim(); // flush 所有未到期的惡化事件

    expect(instance.s.players["小華"].stats.det).toBe(1);
    expect(instance.s.players["小華"].score).toBe(SCORING.deterioration); // -50
    expect(instance.s.phase).toBe("sim_end");
  });
});
