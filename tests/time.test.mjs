// 真太陽時、夏令時間與時區：都挑時辰交界附近的案例，換算錯就會差一個時辰
import { test } from "node:test";
import assert from "node:assert/strict";
import { cityIndex, report } from "./engine.mjs";

const hourZhi = (r) => r.verdict.pillars[3][1];

test("真太陽時：台北 11 月初的 06:45 進入辰時", () => {
  // 經度修正 (121.56-120)×4 ≈ +6 分，11 月初均時差約 +16 分 → 真太陽時約 07:08
  const on = report({ date: "1990-11-03", time: "06:45", city: cityIndex("台北") });
  const off = report({ date: "1990-11-03", time: "06:45", city: cityIndex("台北"), solar: false });
  assert.equal(hourZhi(on), "辰");
  assert.equal(hourZhi(off), "卯");
  assert.match(on.input.timeNote, /經度修正 \+6 分/);
  assert.match(on.input.timeNote, /均時差 \+16 分/);
});

test("真太陽時：金門 2 月中的 07:03 退回卯時", () => {
  // 經度修正 (118.32-120)×4 ≈ -7 分，2 月中均時差約 -14 分 → 真太陽時約 06:42
  const on = report({ date: "1990-02-11", time: "07:03", city: cityIndex("金門") });
  const off = report({ date: "1990-02-11", time: "07:03", city: cityIndex("金門"), solar: false });
  assert.equal(hourZhi(on), "卯");
  assert.equal(hourZhi(off), "辰");
  assert.match(on.input.timeNote, /經度修正 -7 分/);
});

test("鄉鎮的經度會影響真太陽時：台灣最東的貢寮與最西的金門差約 14 分鐘", () => {
  const east = report({ date: "1990-05-01", time: "10:00", city: cityIndex("新北市貢寮區") });
  const west = report({ date: "1990-05-01", time: "10:00", city: cityIndex("金門縣金城鎮") });
  const lon = (r) => +r.input.timeNote.match(/經度修正 ([+-]\d+) 分/)[1];
  assert.ok(lon(east) - lon(west) >= 13, `貢寮 ${lon(east)} 分、金城 ${lon(west)} 分`);
  assert.equal(east.input.city, "新北市貢寮區");
});

test("台灣 1975 年夏令時間：鐘錶 11:20 實為標準時間 10:20（巳時）", () => {
  const r = report({ date: "1975-07-01", time: "11:20", city: cityIndex("台北"), solar: false });
  assert.equal(hourZhi(r), "巳");
  assert.match(r.input.timeNote, /夏令/);
});

test("沒有夏令時間的日子不會加註", () => {
  const r = report({ date: "1990-07-01", time: "11:20", city: cityIndex("台北"), solar: false });
  assert.equal(hourZhi(r), "午");
  assert.doesNotMatch(r.input.timeNote, /夏令/);
});

test("紐約夏令時間：7 月的 13:30 實為標準時間 12:30（午時）", () => {
  const r = report({ date: "1990-07-01", time: "13:30", city: cityIndex("紐約"), solar: false });
  assert.equal(hourZhi(r), "午");
  assert.match(r.input.timeNote, /夏令/);
});

test("南半球夏令時間：雪梨 1 月的 07:30 實為標準時間 06:30（卯時）", () => {
  const r = report({ date: "1995-01-15", time: "07:30", city: cityIndex("雪梨"), solar: false });
  assert.equal(hourZhi(r), "卯");
  assert.match(r.input.timeNote, /夏令/);
});

test("新加入的海外城市也能排盤：多倫多冬天沒有夏令時間", () => {
  const r = report({ date: "1990-01-10", time: "13:30", city: cityIndex("多倫多（加拿大）"), solar: false });
  assert.equal(hourZhi(r), "未");
  assert.doesNotMatch(r.input.timeNote, /夏令/);
  assert.equal(r.input.city, "多倫多（加拿大）");
});

test("出生地編號不合法時退回台北", () => {
  const r = report({ date: "1990-01-10", time: "13:30", city: 999999 });
  assert.equal(r.input.city, "台北");
});
