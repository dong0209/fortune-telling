// 出生地清單：分享連結以清單編號記錄出生地，舊編號不可變動；前後端兩份清單必須一致
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CITY_DATA } from "./engine.mjs";

const CITY_LIST = new Function(readFileSync(new URL("../docs/assets/cities.js", import.meta.url), "utf8") + ";return CITY_LIST")();

// 改版前的 28 筆城市，編號、名稱、座標與時區都不能變
const LEGACY = [
  ["台北", 25.03, 121.56, 8, "Asia/Taipei"], ["新北", 25.01, 121.46, 8, "Asia/Taipei"], ["桃園", 24.99, 121.30, 8, "Asia/Taipei"], ["新竹", 24.80, 120.97, 8, "Asia/Taipei"],
  ["台中", 24.15, 120.67, 8, "Asia/Taipei"], ["彰化", 24.08, 120.54, 8, "Asia/Taipei"], ["嘉義", 23.48, 120.45, 8, "Asia/Taipei"], ["台南", 22.99, 120.21, 8, "Asia/Taipei"],
  ["高雄", 22.63, 120.30, 8, "Asia/Taipei"], ["屏東", 22.67, 120.49, 8, "Asia/Taipei"], ["宜蘭", 24.75, 121.75, 8, "Asia/Taipei"], ["花蓮", 23.99, 121.60, 8, "Asia/Taipei"],
  ["台東", 22.76, 121.14, 8, "Asia/Taipei"], ["澎湖", 23.57, 119.58, 8, "Asia/Taipei"], ["金門", 24.43, 118.32, 8, "Asia/Taipei"], ["香港", 22.32, 114.17, 8, "Asia/Hong_Kong"],
  ["澳門", 22.20, 113.55, 8, "Asia/Macau"], ["上海", 31.23, 121.47, 8, "Asia/Shanghai"], ["北京", 39.90, 116.40, 8, "Asia/Shanghai"], ["新加坡", 1.35, 103.82, 8, "Asia/Singapore"],
  ["吉隆坡", 3.14, 101.69, 8, "Asia/Kuala_Lumpur"], ["東京", 35.68, 139.69, 9, "Asia/Tokyo"], ["首爾", 37.57, 126.98, 9, "Asia/Seoul"], ["雪梨", -33.87, 151.21, 10, "Australia/Sydney"],
  ["倫敦", 51.51, -0.13, 0, "Europe/London"], ["紐約", 40.71, -74.01, -5, "America/New_York"], ["洛杉磯", 34.05, -118.24, -8, "America/Los_Angeles"], ["溫哥華", 49.28, -123.12, -8, "America/Vancouver"],
];

test("舊版 28 筆城市的編號與資料不變", () => {
  assert.deepEqual(CITY_DATA.slice(0, LEGACY.length), LEGACY);
  LEGACY.forEach((c, i) => assert.equal(CITY_LIST[i][0], c[0]));
});

test("前後端清單筆數與順序一致", () => {
  assert.equal(CITY_LIST.length, CITY_DATA.length);
  CITY_LIST.forEach((c, i) => {
    const label = /[市縣]$/.test(c[1]) ? c[1] + c[0] : `${c[0]}（${c[1]}）`;
    if (i >= LEGACY.length) assert.equal(CITY_DATA[i][0], label, `第 ${i} 筆`);
  });
});

test("台灣 22 縣市、368 個鄉鎮市區全部收錄", () => {
  const tw = CITY_LIST.filter((c) => /[市縣]$/.test(c[1]));
  assert.equal(tw.length, 368);
  const count = {};
  tw.forEach((c) => (count[c[1]] = (count[c[1]] ?? 0) + 1));
  assert.deepEqual(count, {
    台北市: 12, 新北市: 29, 基隆市: 7, 桃園市: 13, 新竹市: 3, 新竹縣: 13, 苗栗縣: 18, 台中市: 29, 彰化縣: 26, 南投縣: 13, 雲林縣: 20,
    嘉義市: 2, 嘉義縣: 18, 台南市: 37, 高雄市: 38, 屏東縣: 33, 宜蘭縣: 12, 花蓮縣: 13, 台東縣: 16, 澎湖縣: 6, 金門縣: 6, 連江縣: 4,
  });
  tw.forEach((c) => assert.match(c[0], /[區鄉鎮市]$/, c[0]));
});

test("每筆資料的座標、時區都有效，報告顯示名稱不重複", () => {
  const seen = new Set();
  for (const [label, lat, lon, std, tz] of CITY_DATA) {
    assert.ok(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180, label);
    assert.ok(std >= -12 && std <= 14, label);
    assert.doesNotThrow(() => new Intl.DateTimeFormat("en-US", { timeZone: tz }), `${label} 的時區 ${tz}`);
    assert.ok(!seen.has(label), `重複：${label}`);
    seen.add(label);
  }
});

test("台灣的鄉鎮都在台灣範圍內", () => {
  CITY_DATA.forEach((c, i) => {
    if (!/[市縣]$/.test(CITY_LIST[i][1])) return;
    assert.ok(c[1] > 21.8 && c[1] < 26.4 && c[2] > 118 && c[2] < 122.1, c[0]);
    assert.equal(c[4], "Asia/Taipei", c[0]);
  });
});
