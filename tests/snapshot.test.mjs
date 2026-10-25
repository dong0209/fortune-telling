// 回歸快照：固定幾組命盤的關鍵結果。改了排盤或評分邏輯後若結果變動，這裡會失敗；
// 確認變動是預期的，再執行 npm run update-snapshots 更新 fixtures/reports.json。
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { cityIndex, report } from "./engine.mjs";

const FILE = new URL("./fixtures/reports.json", import.meta.url);
const CASES = {
  "台北 1993-08-12 09:40 女": { date: "1993-08-12", time: "09:40", city: cityIndex("台北"), gender: "女" },
  "高雄 1985-02-03 23:30 男（立春前、子時）": { date: "1985-02-03", time: "23:30", city: cityIndex("高雄"), gender: "男" },
  "台南市永康區 1978-11-20 時間不詳 女": { date: "1978-11-20", noTime: true, city: cityIndex("台南市永康區"), gender: "女" },
  "紐約 2001-06-30 18:15 男（夏令時間）": { date: "2001-06-30", time: "18:15", city: cityIndex("紐約"), gender: "男", name: "王大明" },
};

function summary(r) {
  return {
    input: r.input,
    pillars: r.verdict.pillars,
    call: r.verdict.call,
    avg: r.verdict.avg,
    bazi: { dm: r.bazi.dmG + r.bazi.dmWx, strong: r.bazi.strong, useCat: r.bazi.useCat, dayun: r.bazi.dayun.map((d) => d.gz) },
    ziwei: { soul: r.ziwei.soul, body: r.ziwei.body, fiveElementsClass: r.ziwei.fiveElementsClass, palaces: r.ziwei.palaces.map((p) => p.name + ":" + p.stars.map((s) => s.name + s.mutagen).join("")) },
    astro: r.astro.planets.map((p) => `${p.name}${p.sign}${p.deg}`),
    months: r.months.map((m) => `${m.y}/${m.m} ${Math.round(m.move)}/${Math.round(m.stay)}`),
    fit: r.fit.map((f) => `${f.k}:${Math.round(f.v)}`),
    teasers: Object.fromEntries(Object.entries(r.teasers).map(([k, v]) => [k, v && v.title])),
  };
}

const actual = Object.fromEntries(Object.entries(CASES).map(([k, inp]) => [k, summary(report({ q: "move", yrs: 1, ...inp }, "vip"))]));

if (process.env.UPDATE_SNAPSHOTS || !existsSync(FILE)) {
  writeFileSync(FILE, JSON.stringify(actual, null, 1) + "\n");
  test("已更新回歸快照", () => {});
} else {
  const expected = JSON.parse(readFileSync(FILE, "utf8"));
  for (const k of Object.keys(CASES)) test(`回歸快照：${k}`, () => assert.deepEqual(actual[k], expected[k]));
}
