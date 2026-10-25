// 範例報告必須跟目前的排盤引擎一致；排盤邏輯改變後執行 npm run build-sample 重新產生
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildSample } from "./sample.mjs";

for (const tier of ["free", "paid", "vip"]) {
  test(`範例報告（${tier}）與引擎輸出一致`, () => {
    const saved = JSON.parse(readFileSync(new URL(`../docs/assets/sample/${tier}.json`, import.meta.url), "utf8"));
    assert.deepEqual(saved, JSON.parse(JSON.stringify(buildSample(tier))), "範例資料過期，請執行 cd tests && npm run build-sample");
  });
}

test("免費版範例沒有付費內容，付費版範例沒有 VIP 內容", () => {
  const free = buildSample("free"), paid = buildSample("paid"), vip = buildSample("vip");
  assert.equal(free.report.bazi, undefined);
  assert.equal(free.month, undefined);
  assert.equal(paid.report.qimen, undefined);
  assert.equal(paid.report.hd, undefined);
  assert.equal(paid.qimenDay, undefined);
  assert.ok(vip.report.qimen && vip.report.hd && vip.qimenDay);
});
