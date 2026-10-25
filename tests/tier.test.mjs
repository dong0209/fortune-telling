// 會員等級：免費版拿不到付費內容，付費版拿不到 VIP 功能
import { test } from "node:test";
import assert from "node:assert/strict";
import { engine, NOW, report } from "./engine.mjs";

const INPUT = { date: "1993-08-12", time: "09:40", city: 0, gender: "女", q: "move", yrs: 1 };

test("免費版只有結論、四柱與各學派預覽", () => {
  const r = report(INPUT, "free");
  assert.ok(r.verdict.pillars.length === 4 && r.teasers);
  for (const k of ["bazi", "ziwei", "astro", "months", "fit", "iching", "numerology"]) assert.equal(r[k], undefined, `免費版不應有 ${k}`);
  assert.equal(r.verdict.windows, undefined);
});

test("付費版有完整解讀，VIP 版再多出 VIP 專屬內容", () => {
  const paid = report(INPUT, "paid"), vip = report(INPUT, "vip");
  for (const k of ["bazi", "ziwei", "astro", "months", "fit"]) assert.ok(paid[k], `付費版應有 ${k}`);
  const paidKeys = new Set(Object.keys(paid));
  assert.ok(Object.keys(vip).some((k) => !paidKeys.has(k)), "VIP 應比付費版多出內容");
});

test("未知等級一律當作免費版", () => {
  assert.equal(report(INPUT, "admin").tier, "free");
});

test("付費功能依等級擋下", () => {
  const run = (name, tier) => engine.runAction(name, INPUT, tier, {}, NOW);
  assert.throws(() => run("month", "free"), (e) => e.code === "forbidden" && e.need === "paid");
  assert.throws(() => run("offer", "free"), (e) => e.code === "forbidden");
  assert.throws(() => run("synastry", "paid"), (e) => e.code === "forbidden" && e.need === "vip");
  assert.throws(() => run("qimenDay", "paid"), (e) => e.code === "forbidden" && e.need === "vip");
  assert.throws(() => run("nope", "vip"), /未知的功能/);
});

test("同樣的輸入每次結果相同", () => {
  assert.deepEqual(report(INPUT, "vip"), report(INPUT, "vip"));
});
