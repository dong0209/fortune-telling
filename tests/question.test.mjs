// 「你現在最想問的」只改變天機總斷的重點與措辭，排盤數據與內容分級都不能因此改變
import { test } from "node:test";
import assert from "node:assert/strict";
import { report } from "./engine.mjs";

const BASE = { date: "1993-08-12", time: "09:40", city: 0, gender: "女", yrs: 1 };
const QS = ["move", "stay", "fit", "biz"];
// 拿掉會隨問題改變的欄位：總斷的結論、副標，以及標記問題的 input.q
function strip(r) {
  const c = structuredClone(r);
  delete c.verdict.call; delete c.verdict.sub; delete c.input.q;
  return c;
}
// 所有欄位的路徑（陣列索引一律記為 []），用來比對回傳的欄位集合
function paths(o, pre = "") {
  if (o === null || typeof o !== "object") return [pre];
  const keys = Array.isArray(o) ? o.flatMap((v) => paths(v, pre + "[]")) : Object.keys(o).flatMap((k) => paths(o[k], pre + "." + k));
  return keys.length ? keys : [pre];
}

for (const tier of ["free", "paid", "vip"]) {
  test(`${tier}：四個問題的結論各不相同，報告記錄回答的是哪個問題`, () => {
    const calls = QS.map((q) => report({ ...BASE, q }, tier).verdict.call);
    assert.equal(new Set(calls).size, 4, calls.join(" / "));
    for (const q of QS) assert.equal(report({ ...BASE, q }, tier).input.q, q);
  });

  test(`${tier}：問題以外的內容（曲線、分數、排名、各學派）完全相同`, () => {
    const base = strip(report({ ...BASE, q: "move" }, tier));
    for (const q of QS.slice(1)) assert.deepEqual(strip(report({ ...BASE, q }, tier)), base, `q=${q}`);
  });

  test(`${tier}：四個問題回傳的欄位集合相同，不會因為換問題多拿到資料`, () => {
    const base = [...new Set(paths(report({ ...BASE, q: "move" }, tier)))].sort();
    for (const q of QS.slice(1)) assert.deepEqual([...new Set(paths(report({ ...BASE, q }, tier)))].sort(), base, `q=${q}`);
  });
}

test("不合法的問題退回 move，舊的分享連結與記住的生辰照常使用", () => {
  assert.deepEqual(report({ ...BASE, q: "nope" }, "paid"), report({ ...BASE, q: "move" }, "paid"));
  assert.deepEqual(report({ ...BASE }, "paid"), report({ ...BASE, q: "move" }, "paid"));
});

test("各問題的結論回答的是該問題", () => {
  const v = (q) => report({ ...BASE, q }, "paid").verdict, paid = report({ ...BASE, q: "move" }, "paid");
  assert.ok(v("fit").call.includes(paid.fit[0].name), "fit 的結論要直接講最適合的公司類型");
  assert.match(v("stay").call, /升遷/);
  assert.match(v("biz").call, /創業|組織/);
  assert.match(v("move").sub, /最適合轉職的是 \d{4} 年 \d{1,2} 月/);
  assert.match(v("stay").sub, /升遷動能最強的是 \d{4} 年 \d{1,2} 月/);
});
