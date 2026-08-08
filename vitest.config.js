// 用 Cloudflare 官方 workers pool 跑 DO 測試（可直接 new 出 DO、送訊息）
//
// 注意：brief 原本示範的 `defineWorkersConfig`（從 "@cloudflare/vitest-pool-workers/config" 匯入）
// 是舊版（搭配 vitest 1–3）的寫法。`npm install -D vitest @cloudflare/vitest-pool-workers`
// 裝到的是目前 npm 上的最新版（vitest 4.x + vitest-pool-workers 0.20.x），
// 該版本已無 "./config" 這個 export（實測：npm test 直接報
// `Missing "./config" specifier in "@cloudflare/vitest-pool-workers" package`），
// 改成用 vitest 官方的 defineConfig + `cloudflareTest` plugin（見套件內建
// dist/codemods/vitest-v3-to-v4.mjs 的官方遷移腳本，即此處寫法的依據）。
// wrangler configPath 語意不變，仍指向同一份 wrangler.jsonc（含 migration tag "v1"）。
import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })],
});
