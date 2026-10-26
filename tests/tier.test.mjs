// 會員等級：免費版拿不到付費內容，付費版拿不到 VIP 功能
import { test } from "node:test";
import assert from "node:assert/strict";
import { engine, NOW, report } from "./engine.mjs";

const INPUT = { date: "1993-08-12", time: "09:40", city: 0, gender: "女", q: "move", yrs: 1 };

test("免費版回答三個問題的簡短版：走或留、12 個月內最佳月份、最適合的公司類型", () => {
  const r = report(INPUT, "free"), paid = report(INPUT, "paid");
  assert.ok(r.verdict.pillars.length === 4 && r.teasers);
  for (const k of ["bazi", "ziwei", "astro", "months", "fit", "iching", "numerology"]) assert.equal(r[k], undefined, `免費版不應有 ${k}`);
  assert.equal(r.verdict.windows, undefined);
  assert.equal(r.verdict.summary, undefined);
  // 最佳月份落在未來 12 個月內，且就是付費版曲線前 12 個月的最高點
  const year = paid.months.slice(0, 12);
  for (const k of ["move", "stay"]) {
    const n = r.verdict.next[k], top = Math.max(...year.map((m) => m[k]));
    assert.deepEqual(Object.keys(n).sort(), ["m", "v", "y"]);
    assert.equal(n.v, top);
    assert.ok(year.some((m) => m.y === n.y && m.m === n.m && m[k] === top));
  }
  assert.equal(r.verdict.topFit.name, paid.fit[0].name);
  assert.equal(paid.verdict.next, undefined);
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

test("付費功能依等級擋下：交叉比對從付費版開始，決策工具（offer、現職適配、合盤、擇時）為 VIP 專屬", () => {
  const run = (name, tier) => engine.runAction(name, INPUT, tier, {}, NOW);
  assert.throws(() => run("month", "free"), (e) => e.code === "forbidden" && e.need === "paid");
  const cmp = (systems, tier) => engine.runAction("compare", INPUT, tier, { systems }, NOW);
  assert.throws(() => cmp(["bazi"], "free"), (e) => e.code === "forbidden" && e.need === "paid");
  assert.equal(cmp(["bazi", "ziwei"], "paid").cards.length, 2);
  assert.throws(() => cmp(["bazi", "ziwei", "astro"], "paid"), (e) => e.code === "forbidden" && e.need === "vip");
  assert.throws(() => cmp(["meihua"], "paid"), (e) => e.code === "forbidden" && e.need === "vip");
  assert.throws(() => run("offer", "free"), (e) => e.code === "forbidden");
  assert.throws(() => run("offer", "paid"), (e) => e.code === "forbidden" && e.need === "vip");
  assert.throws(() => run("fitnow", "paid"), (e) => e.code === "forbidden" && e.need === "vip");
  assert.throws(() => run("synastry", "paid"), (e) => e.code === "forbidden" && e.need === "vip");
  assert.throws(() => run("qimenDay", "paid"), (e) => e.code === "forbidden" && e.need === "vip");
  assert.throws(() => run("nope", "vip"), /未知的功能/);
});

test("同樣的輸入每次結果相同", () => {
  assert.deepEqual(report(INPUT, "vip"), report(INPUT, "vip"));
});

test("免費版與付費版有今天的運勢，VIP 有未來 7 天", () => {
  assert.equal(report(INPUT, "free").today.length, 1);
  assert.deepEqual(report(INPUT, "free").today, report(INPUT, "paid").today);
  assert.equal(report(INPUT, "paid").today.length, 1);
  assert.equal(report(INPUT, "vip").today.length, 7);
});

test("月份詳解的每日吉日只給 VIP，付費版只知道吉日落在哪一旬", () => {
  const paid = engine.runAction("month", INPUT, "paid", { i: 2 }, NOW), vip = engine.runAction("month", INPUT, "vip", { i: 2 }, NOW);
  assert.equal(paid.good, undefined);
  assert.match(paid.goodHint.xun, /^[上中下]旬$/);
  assert.ok(vip.good.length > 0 && vip.good.every((g) => g.date && g.door));
  assert.equal(vip.goodHint, undefined);
});

test("非 VIP 會拿到個人化線索，但拿不到 VIP 的完整內容", () => {
  for (const tier of ["free", "paid"]) {
    const r = report(INPUT, tier), h = r.hints;
    assert.equal(h.consensus.systems, 10);
    assert.equal(h.consensus.voted, h.consensus.votes.move + h.consensus.votes.stay + h.consensus.votes.wait);
    assert.ok(h.qimen.count >= 0 && h.hd.type);
    for (const k of ["qimen", "hd", "meihua", "ninestar"]) assert.equal(r[k], undefined, `${tier} 不應有 ${k}`);
    // 線索只有摘要：奇門只給吉日數與最近一天，不含方位、值使門
    assert.deepEqual(Object.keys(h.qimen).sort(), ["count", "next"]);
    assert.deepEqual(Object.keys(h.hd), ["type"]);
  }
  for (const tier of ["free", "paid"]) assert.equal(report(INPUT, tier).hints.week.max >= 0, true);
  assert.equal(report(INPUT, "vip").hints, undefined);
});

test("線索的投票結果與 VIP 實際比對 10 種學派的結果一致", () => {
  const h = report(INPUT, "paid").hints.consensus;
  const all = engine.runAction("compare", INPUT, "vip", { systems: ["bazi", "ziwei", "iching", "name", "meihua", "ninestar", "qimen", "astro", "numerology", "hd"] }, NOW).consensus;
  assert.deepEqual(h.votes, all.votes);
  assert.equal(h.lead, all.lead);
});
