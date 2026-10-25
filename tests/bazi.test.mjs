// 八字四柱：用獨立的曆法公式驗證，不依賴排盤函式庫本身
import { test } from "node:test";
import assert from "node:assert/strict";
import { report } from "./engine.mjs";

const GAN = "甲乙丙丁戊己庚辛壬癸", ZHI = "子丑寅卯辰巳午未申酉戌亥";
const gz = (i) => GAN[((i % 60) + 60) % 60 % 10] + ZHI[((i % 60) + 60) % 60 % 12];
// 1900-01-01 為甲戌日（六十甲子第 10 位），之後每天往後推一位
const dayGz = (y, m, d) => gz(10 + Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 1)) / 86400000));
// 立春後的年柱：西元 4 年為甲子年
const yearGz = (y) => gz(y - 4);
// 五虎遁：甲己之年丙作首（寅月天干）；n 為從寅月起算的第幾個月
const monthGz = (yearStem, n) => GAN[((GAN.indexOf(yearStem) % 5) * 2 + 2 + n) % 10] + ZHI[(2 + n) % 12];
// 五鼠遁：甲己還加甲（子時天干）
const hourGz = (dayStem, branch) => GAN[((GAN.indexOf(dayStem) % 5) * 2 + ZHI.indexOf(branch)) % 10] + branch;

// 正午出生、不做真太陽時，避開換日與時辰交界；6 月 15 日在芒種之後、小暑之前，月支為午（寅月起第 4 個月）
const CASES = [1950, 1966, 1975, 1984, 1993, 2000, 2008, 2016, 2024].map((y) => ({ y, m: 6, d: 15 }));

for (const c of CASES) {
  test(`${c.y}-06-15 正午的四柱`, () => {
    const p = report({ date: `${c.y}-06-15`, time: "12:00", city: 0, solar: false }).verdict.pillars;
    const y = yearGz(c.y), d = dayGz(c.y, c.m, c.d);
    assert.equal(p[0], y, "年柱");
    assert.equal(p[1], monthGz(y[0], 4), "月柱");
    assert.equal(p[2], d, "日柱");
    assert.equal(p[3], hourGz(d[0], "午"), "時柱");
  });
}

test("立春前出生算前一年", () => {
  // 2000-01-01 尚未立春：己卯年、丙子月、戊午日
  const p = report({ date: "2000-01-01", time: "12:00", city: 0, solar: false }).verdict.pillars;
  assert.deepEqual(p.slice(0, 3), ["己卯", "丙子", "戊午"]);
  assert.equal(p[2], dayGz(2000, 1, 1));
});

test("日柱連續六十天循環不中斷", () => {
  for (let i = 0; i < 60; i++) {
    const t = new Date(Date.UTC(1993, 2, 1) + i * 86400000);
    const date = t.toISOString().slice(0, 10);
    const p = report({ date, time: "12:00", city: 0, solar: false }).verdict.pillars;
    assert.equal(p[2], dayGz(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()), date);
  }
});

test("十二時辰的地支", () => {
  const hours = ["00:30", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
  hours.forEach((t, i) => {
    const p = report({ date: "1993-08-12", time: t, city: 0, solar: false }).verdict.pillars;
    assert.equal(p[3][1], ZHI[i], t);
  });
});

test("不確定出生時間時不排時柱的影響：仍回傳結果且標記", () => {
  const r = report({ date: "1993-08-12", noTime: true, city: 0 });
  assert.equal(r.verdict.noTime, true);
  assert.equal(r.input.time, null);
});

test("出生日期範圍與格式檢查", () => {
  assert.throws(() => report({ date: "1919-12-31", time: "12:00", city: 0 }), /1920 到 2025/);
  assert.throws(() => report({ date: "1993-02-30", time: "12:00", city: 0 }), /不存在/);
  assert.throws(() => report({ date: "1993-08-12", time: "25:00", city: 0 }), /時間格式/);
});
