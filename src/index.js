// TTAS 檢傷遊戲 — Cloudflare Worker + Durable Object 遊戲伺服器
import { QUIZ, PATIENTS, CONFIG, SCORING } from "./questions.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const room = (url.searchParams.get("room") || "MAIN").toUpperCase().slice(0, 8);
      const id = env.ROOMS.idFromName(room);
      return env.ROOMS.get(id).fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};

const PHASES = { LOBBY: "lobby", QUIZ: "quiz", QUIZ_REVEAL: "quiz_reveal", QUIZ_END: "quiz_end",
                 SIM: "sim", SIM_REVEAL: "sim_reveal", SIM_WAIT: "sim_wait", SIM_END: "sim_end",
                 // ---- course 模式（Task 2.1 新增，classic 不引用）----
                 // 三段式：COURSE_Q（作答）→ COURSE_DIST（只看分佈，不揭答案，Kolb 停頓）→ COURSE_REVEAL（揭答案+計分）
                 COURSE_Q: "course_q", COURSE_DIST: "course_dist", COURSE_REVEAL: "course_reveal", COURSE_END: "course_end" };

export class GameRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.ctx.blockConcurrencyWhile(async () => {
      const saved = await this.ctx.storage.get("state");
      this.s = saved || this.freshState();
    });
  }

  freshState() {
    return {
      phase: PHASES.LOBBY,
      qi: -1,                 // 目前 quiz 題號
      pi: -1,                 // 目前病人編號
      deadline: 0,            // 目前作答期限（server ms）
      answers: {},            // name -> { v, at }  本題/本病人作答
      players: {},            // name -> player 狀態
      pendingDet: [],         // [{ dueArrival, ptIndex, victims: [names] }]
      lastReveal: null,       // 重連時重繪用
      ci: -1,                 // 目前 course 題號（course 模式專用，classic 不讀取）
    };
  }

  newPlayer() {
    return { score: 0, beds: [],  // beds: 佔用中的床（釋放時的病人編號）
             stats: { qCorrect: 0, simCorrect: 0, under: 0, over: 0, noBed: 0, det: 0 } };
  }

  async save() { await this.ctx.storage.put("state", this.s); }

  // ---------- WebSocket 進出 ----------
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket", { status: 426 });
    }
    const url = new URL(request.url);
    const role = url.searchParams.get("role") === "host" ? "host" : "player";
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.serializeAttachment({ role, name: null });
    this.ctx.acceptWebSocket(server, [role]);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const att = ws.deserializeAttachment() || {};

    if (att.role === "host") return this.onHost(ws, msg);

    if (msg.t === "join") {
      let name = String(msg.name || "").trim().slice(0, 12);
      if (!name) return;
      if (!this.s.players[name]) this.s.players[name] = this.newPlayer();
      ws.serializeAttachment({ role: "player", name });
      await this.save();
      this.sendTo(ws, { t: "joined", name, score: this.s.players[name].score });
      this.sendSync(ws, name);
      this.broadcastLobby();
      return;
    }
    if (!att.name) return;
    if (msg.t === "ans") return this.onAnswer(att.name, msg.v);
    if (msg.t === "sync") return this.sendSync(ws, att.name);
  }

  async webSocketClose() { this.broadcastLobby(); }
  async webSocketError() { this.broadcastLobby(); }

  // ---------- Host 指令 ----------
  async onHost(ws, msg) {
    switch (msg.t) {
      case "hello": this.sendSync(ws, null); this.broadcastLobby(); break;
      case "quiz_start": if (this.s.phase === PHASES.LOBBY) await this.nextQuiz(); break;
      case "next":
        if (this.s.phase === PHASES.QUIZ) await this.revealQuiz();          // 提前揭曉
        else if (this.s.phase === PHASES.QUIZ_REVEAL) await this.nextQuiz();
        else if (this.s.phase === PHASES.SIM) await this.revealPatient();   // 模擬：提前揭曉本病人
        else if (this.s.phase === PHASES.SIM_WAIT) await this.arrivePatient(); // 模擬：跳過等待，下一位立即抵達
        break;
      case "sim_start": if (this.s.phase === PHASES.QUIZ_END || this.s.phase === PHASES.LOBBY) await this.startSim(); break;
      case "reset":
        this.s = this.freshState();
        await this.ctx.storage.deleteAll();
        await this.save();
        this.broadcast({ t: "reset" });
        break;
      // ---- course 模式（Task 2.1 新增）----
      // 三顆講師按鈕天然分離：show_dist / reveal / course_next 各自獨立鍵，
      // 不可用一顆連跳（reveal 是新 key，與 classic 的 next 不同鍵）。
      case "course_start": if (this.s.phase === PHASES.LOBBY) await this.startCourse(); break;
      case "show_dist":    if (this.s.phase === PHASES.COURSE_Q) await this.courseShowDist(); break;
      case "reveal":       if (this.s.phase === PHASES.COURSE_DIST) await this.courseReveal(); break;
      case "course_next":  if (this.s.phase === PHASES.COURSE_REVEAL) await this.courseNextQ(); break;
    }
  }

  // ---------- Quiz ----------
  quizSecs(q) { return q.secs || CONFIG.quizSecs; }

  async nextQuiz() {
    this.s.qi++;
    if (this.s.qi >= QUIZ.length) return this.endQuiz();
    const q = QUIZ[this.s.qi];
    this.s.phase = PHASES.QUIZ;
    this.s.answers = {};
    this.s.deadline = Date.now() + this.quizSecs(q) * 1000;
    this.s.lastReveal = null;
    await this.ctx.storage.setAlarm(this.s.deadline);
    await this.save();
    this.broadcast(this.qPayload());
  }

  qPayload() {
    const q = QUIZ[this.s.qi];
    return { t: "q", i: this.s.qi, total: QUIZ.length, kind: q.kind, text: q.text,
             options: q.kind === "choice" ? q.options : null,
             secs: this.quizSecs(q), endsAt: this.s.deadline, now: Date.now() };
  }

  async onAnswer(name, v) {
    const inQuiz = this.s.phase === PHASES.QUIZ;
    const inSim = this.s.phase === PHASES.SIM;
    const inCourseQ = this.s.phase === PHASES.COURSE_Q; // course 模式（Task 2.1）：最小 OR 擴充，不動 classic 兩條件
    if (!inQuiz && !inSim && !inCourseQ) return;
    if (Date.now() > this.s.deadline) return;
    v = Number(v);
    if (!Number.isInteger(v)) return;
    this.s.answers[name] = { v, at: Date.now() };     // 時間內可重複覆蓋＝更改答案（速度加成以最後送出時間計）
    await this.save();
    this.broadcast({ t: "progress", answered: Object.keys(this.s.answers).length,
                     players: Object.keys(this.s.players).length });
    // 不再「全員答完就自動揭曉」——讓所有人在時限內都能改答案；
    // 由計時器（時間到）或講師按「提前揭曉」來揭曉。
  }

  async revealQuiz() {
    if (this.s.phase !== PHASES.QUIZ) return;
    const q = QUIZ[this.s.qi];
    this.s.phase = PHASES.QUIZ_REVEAL;
    await this.ctx.storage.deleteAlarm();
    const nOpts = q.kind === "choice" ? q.options.length : 5;
    const dist = new Array(nOpts).fill(0);
    const total = this.quizSecs(q) * 1000;
    const startAt = this.s.deadline - total;

    for (const [name, a] of Object.entries(this.s.answers)) {
      const idx = q.kind === "choice" ? a.v : a.v - 1;
      if (idx >= 0 && idx < nOpts) dist[idx]++;
      const p = this.s.players[name];
      if (!p) continue;
      const correct = q.kind === "choice" ? a.v === q.ans : a.v === q.ans;
      if (correct) {
        const speed = Math.max(0, Math.round(SCORING.quizSpeedMax * (this.s.deadline - a.at) / total));
        const delta = SCORING.quizBase + speed;
        p.score += delta;
        p.stats.qCorrect++;
        this.tellPlayer(name, { t: "you", correct: true, delta, score: p.score });
      } else {
        this.tellPlayer(name, { t: "you", correct: false, delta: 0, score: p.score });
      }
    }
    for (const name of Object.keys(this.s.players)) {
      if (this.s.answers[name] === undefined) {
        this.tellPlayer(name, { t: "you", correct: false, delta: 0, score: this.s.players[name].score, missed: true });
      }
    }
    this.s.lastReveal = { t: "reveal", scope: "quiz", i: this.s.qi, kind: q.kind,
                          ans: q.ans, options: q.kind === "choice" ? q.options : null,
                          dist, explain: q.explain, src: q.src, board: this.board() };
    await this.save();
    this.broadcast(this.s.lastReveal);
  }

  async endQuiz() {
    this.s.phase = PHASES.QUIZ_END;
    this.s.lastReveal = { t: "quiz_end", board: this.board() };
    await this.save();
    this.broadcast(this.s.lastReveal);
  }

  // ---------- Course 模式：三段式 phase 機（Task 2.1 新增，classic 不引用）----------
  // 三段式先套用在 Part 1 題庫（QUIZ）內容上，用 this.s.ci 當題目索引（類比 classic 的 qi）。
  // 講師手動推進三段（course_start → show_dist → reveal → course_next），
  // 不掛會自動揭曉的 alarm，避免三段被合成一鍵（違反三顆按鈕分離的硬規則）。
  courseQPayload() {
    const q = QUIZ[this.s.ci];
    return { t: "cq", i: this.s.ci, total: QUIZ.length, kind: q.kind, text: q.text,
             options: q.kind === "choice" ? q.options : null,
             secs: this.quizSecs(q), endsAt: this.s.deadline, now: Date.now() };
  }

  async startCourse() {
    this.s.phase = PHASES.COURSE_Q;
    this.s.ci = 0;
    this.s.answers = {};
    const q = QUIZ[this.s.ci];
    this.s.deadline = Date.now() + this.quizSecs(q) * 1000;
    await this.save();
    this.broadcast(this.courseQPayload());
  }

  async courseShowDist() {
    if (this.s.phase !== PHASES.COURSE_Q) return;
    const q = QUIZ[this.s.ci];
    this.s.phase = PHASES.COURSE_DIST;
    const nOpts = q.kind === "choice" ? q.options.length : 5;
    const dist = new Array(nOpts).fill(0);
    for (const [name, a] of Object.entries(this.s.answers)) {
      const idx = q.kind === "choice" ? a.v : a.v - 1;
      if (idx >= 0 && idx < nOpts) dist[idx]++;
    }
    // Kolb 停頓：只給分佈、不計分、不揭答案（嚴禁含 ans/explain/src）
    const payload = { t: "cdist", i: this.s.ci, kind: q.kind, dist };
    await this.save();
    this.broadcast(payload);
    return payload;
  }

  async courseReveal() {
    if (this.s.phase !== PHASES.COURSE_DIST) return;
    const q = QUIZ[this.s.ci];
    this.s.phase = PHASES.COURSE_REVEAL;
    const total = this.quizSecs(q) * 1000;

    for (const [name, a] of Object.entries(this.s.answers)) {
      const p = this.s.players[name];
      if (!p) continue;
      const correct = a.v === q.ans;
      if (correct) {
        const speed = Math.max(0, Math.round(SCORING.quizSpeedMax * (this.s.deadline - a.at) / total));
        const delta = SCORING.quizBase + speed;
        p.score += delta;
        p.stats.qCorrect++;
        this.tellPlayer(name, { t: "you", correct: true, delta, score: p.score });
      } else {
        this.tellPlayer(name, { t: "you", correct: false, delta: 0, score: p.score });
      }
    }
    for (const name of Object.keys(this.s.players)) {
      if (this.s.answers[name] === undefined) {
        this.tellPlayer(name, { t: "you", correct: false, delta: 0, score: this.s.players[name].score, missed: true });
      }
    }
    const payload = { t: "creveal", i: this.s.ci, ans: q.ans,
                      options: q.kind === "choice" ? q.options : null,
                      explain: q.explain, src: q.src, board: this.board() };
    this.s.lastReveal = payload;
    await this.save();
    this.broadcast(payload);
    return payload;
  }

  async courseNextQ() {
    if (this.s.phase !== PHASES.COURSE_REVEAL) return;
    this.s.ci++;
    if (this.s.ci >= QUIZ.length) {
      this.s.phase = PHASES.COURSE_END;
      this.s.lastReveal = { t: "course_end", board: this.board() };
      await this.save();
      this.broadcast(this.s.lastReveal);
      return;
    }
    this.s.phase = PHASES.COURSE_Q;
    this.s.answers = {};
    const q = QUIZ[this.s.ci];
    this.s.deadline = Date.now() + this.quizSecs(q) * 1000;
    this.s.lastReveal = null;
    await this.save();
    this.broadcast(this.courseQPayload());
  }

  // ---------- 模擬（檢傷站的一小時） ----------
  async startSim() {
    this.s.phase = PHASES.SIM_WAIT;
    this.s.pi = -1;
    this.s.pendingDet = [];
    for (const p of Object.values(this.s.players)) p.beds = [];
    this.s.lastReveal = null;
    const firstAt = Date.now() + 5000;               // 5 秒後第一位病人抵達
    this.s.deadline = firstAt;
    await this.ctx.storage.setAlarm(this.s.deadline);
    await this.save();
    this.broadcast({ t: "sim_intro", total: PATIENTS.length, beds: CONFIG.bedCount,
                     now: Date.now(), firstAt, board: this.board() });
  }

  async arrivePatient() {
    this.s.pi++;
    if (this.s.pi >= PATIENTS.length) return this.endSim();

    // 觸發到期的惡化事件
    const due = this.s.pendingDet.filter(d => d.dueArrival <= this.s.pi);
    this.s.pendingDet = this.s.pendingDet.filter(d => d.dueArrival > this.s.pi);
    for (const d of due) this.fireDeterioration(d);

    // 釋放到期的急救床
    for (const p of Object.values(this.s.players)) {
      p.beds = p.beds.filter(rel => rel > this.s.pi);
    }

    const pt = PATIENTS[this.s.pi];
    this.s.phase = PHASES.SIM;
    this.s.answers = {};
    this.s.deadline = Date.now() + CONFIG.ptSecs * 1000;
    await this.ctx.storage.setAlarm(this.s.deadline);
    await this.save();
    this.broadcast(this.ptPayload());
    for (const name of Object.keys(this.s.players)) this.sendBeds(name);
  }

  ptPayload() {
    const pt = PATIENTS[this.s.pi];
    return { t: "pt", i: this.s.pi, total: PATIENTS.length, label: pt.label,
             vign: pt.vign, vitals: pt.vitals, secs: CONFIG.ptSecs,
             endsAt: this.s.deadline, now: Date.now(), board: this.board() };
  }

  fireDeterioration(d) {
    const pt = PATIENTS[d.ptIndex];
    for (const name of d.victims) {
      const p = this.s.players[name];
      if (!p) continue;
      p.score += SCORING.deterioration;
      p.stats.det++;
      this.tellPlayer(name, { t: "you", event: "det", delta: SCORING.deterioration, score: p.score, text: pt.det });
    }
    this.broadcast({ t: "evt", kind: "det", label: pt.label, text: pt.det,
                     victims: d.victims, penalty: SCORING.deterioration });
  }

  async revealPatient() {
    if (this.s.phase !== PHASES.SIM) return;
    const pt = PATIENTS[this.s.pi];
    this.s.phase = PHASES.SIM_REVEAL;
    await this.ctx.storage.deleteAlarm();
    const dist = new Array(5).fill(0);
    const victims = [];

    for (const name of Object.keys(this.s.players)) {
      const p = this.s.players[name];
      const a = this.s.answers[name];
      let delta = 0;
      if (!a) {
        // 未作答＝漏掉病人；只有漏掉 1-2 級病人才算 under-triage 並可能觸發惡化
        if (pt.ans <= 2) {
          p.stats.under++;
          if (pt.det) victims.push(name);
        }
        this.tellPlayer(name, { t: "you", correct: false, delta: 0, score: p.score, missed: true });
        continue;
      }
      const v = a.v;
      if (v >= 1 && v <= 5) dist[v - 1]++;
      const diff = v - pt.ans;                        // 正值＝分得比正解不緊急（under）
      if (diff === 0) { delta = SCORING.simCorrect; p.stats.simCorrect++; }
      else if (Math.abs(diff) === 1) { delta = SCORING.simOffByOne; }
      else if (diff >= 2) {
        delta = SCORING.simUnder2;
        p.stats.under++;
        if (pt.det) victims.push(name);
      }
      if (diff <= -1 && pt.ans >= 3 && v <= 2) {      // over-triage
        delta += SCORING.overTriage;
        p.stats.over++;
      }
      // 佔床：給 1-2 級就佔一床。床滿時：over-triage 才額外扣分（正確檢傷不因床滿受罰）
      if (v <= 2) {
        const isOver = pt.ans >= 3;
        if (p.beds.length >= CONFIG.bedCount) {
          if (isOver) {
            delta += SCORING.noBed;
            p.stats.noBed++;
            this.tellPlayer(name, { t: "you", event: "nobed", delta: SCORING.noBed, score: p.score + delta });
          }
        } else {
          p.beds.push(this.s.pi + CONFIG.bedHoldPatients);
        }
      }
      p.score += delta;
      this.tellPlayer(name, { t: "you", correct: diff === 0, delta, score: p.score });
      this.sendBeds(name);
    }

    if (victims.length) {
      this.s.pendingDet.push({ dueArrival: this.s.pi + CONFIG.detDelayPatients, ptIndex: this.s.pi, victims });
    }
    // 先算好下一位病人抵達時間，讓投影端與手機端能倒數（不改變任何計分或抵達邏輯）
    const nextAt = Date.now() + CONFIG.ptGapSecs * 1000;
    const isLast = this.s.pi + 1 >= PATIENTS.length;
    this.s.lastReveal = { t: "pt_reveal", i: this.s.pi, label: pt.label, ans: pt.ans, dist,
                          explain: pt.explain, src: pt.src, board: this.board(),
                          nextAt, now: Date.now(), gapSecs: CONFIG.ptGapSecs, isLast };

    // 排下一位病人抵達
    this.s.phase = PHASES.SIM_WAIT;
    this.s.deadline = nextAt;
    await this.ctx.storage.setAlarm(this.s.deadline);
    await this.save();
    this.broadcast(this.s.lastReveal);
  }

  async endSim() {
    // 把尚未到期的惡化事件全數觸發（結算前攤牌）
    for (const d of this.s.pendingDet) this.fireDeterioration(d);
    this.s.pendingDet = [];
    this.s.phase = PHASES.SIM_END;
    const per = {};
    for (const [name, p] of Object.entries(this.s.players)) {
      per[name] = { ...p.stats, score: p.score };
    }
    const teamDet = Object.values(per).reduce((s, x) => s + x.det, 0);
    this.s.lastReveal = { t: "sim_end", board: this.board(), per, teamDet,
                          debrief: "Under-triage 和 over-triage，哪個代價比較大？為什麼檢傷寧可 over？" };
    await this.save();
    this.broadcast(this.s.lastReveal);
  }

  // ---------- Alarm：計時引擎 ----------
  async alarm() {
    if (this.s.phase === PHASES.QUIZ) return this.revealQuiz();
    if (this.s.phase === PHASES.SIM) return this.revealPatient();
    if (this.s.phase === PHASES.SIM_WAIT) return this.arrivePatient();
  }

  // ---------- 傳訊工具 ----------
  board() {
    return Object.entries(this.s.players)
      .map(([name, p]) => ({ name, score: p.score, beds: p.beds.length }))
      .sort((a, b) => b.score - a.score);
  }

  broadcast(obj) {
    const raw = JSON.stringify(obj);
    for (const ws of this.ctx.getWebSockets()) { try { ws.send(raw); } catch {} }
  }

  sendTo(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch {} }

  tellPlayer(name, obj) {
    const raw = JSON.stringify(obj);
    for (const ws of this.ctx.getWebSockets("player")) {
      const att = ws.deserializeAttachment() || {};
      if (att.name === name) { try { ws.send(raw); } catch {} }
    }
  }

  sendBeds(name) {
    const p = this.s.players[name];
    if (!p) return;
    this.tellPlayer(name, { t: "beds", used: p.beds.length, total: CONFIG.bedCount });
  }

  broadcastLobby() {
    const names = [];
    for (const ws of this.ctx.getWebSockets("player")) {
      const att = ws.deserializeAttachment() || {};
      if (att.name) names.push(att.name);
    }
    this.broadcast({ t: "lobby", online: names, joined: Object.keys(this.s.players), phase: this.s.phase });
  }

  sendSync(ws, name) {
    // 重連/加入時重繪目前畫面
    const out = { t: "sync", phase: this.s.phase, now: Date.now(), board: this.board() };
    if (this.s.phase === PHASES.QUIZ) out.q = this.qPayload();
    if (this.s.phase === PHASES.SIM) out.pt = this.ptPayload();
    if (this.s.lastReveal) out.reveal = this.s.lastReveal;
    if (name && this.s.players[name]) {
      out.you = { score: this.s.players[name].score,
                  beds: this.s.players[name].beds.length, bedTotal: CONFIG.bedCount,
                  answered: this.s.answers[name] !== undefined };
    }
    this.sendTo(ws, out);
  }
}
