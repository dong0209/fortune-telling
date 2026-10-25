// 產生出生地清單：supabase/functions/_shared/cities.js（伺服器排盤用）與 docs/assets/cities.js（網頁搜尋用）
//
// 資料來源：GeoNames（https://www.geonames.org，CC BY 4.0）。
// 使用方式：
//   1. 下載以下檔案到同一個資料夾（例如 /tmp/geonames）：
//        https://download.geonames.org/export/dump/TW.zip
//        https://download.geonames.org/export/dump/cities15000.zip
//        https://download.geonames.org/export/dump/alternateNamesV2.zip
//        https://download.geonames.org/export/dump/countryInfo.txt
//   2. cd scripts/cities && npm install && node build.mjs /tmp/geonames
//
// 清單前 28 筆是舊版的城市，順序與座標不可更動：分享連結以清單編號記錄出生地。
import { execFileSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import * as OpenCC from "opencc-js";

const SRC = process.argv[2];
if (!SRC) throw new Error("請指定 GeoNames 檔案所在的資料夾");
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const toTW = OpenCC.Converter({ from: "cn", to: "tw" });

// 舊版城市：[名稱, 緯度, 經度, 標準時區偏移, IANA 時區, 國家代碼]
const LEGACY = [
  ["台北", 25.03, 121.56, 8, "Asia/Taipei", "TW"], ["新北", 25.01, 121.46, 8, "Asia/Taipei", "TW"], ["桃園", 24.99, 121.30, 8, "Asia/Taipei", "TW"],
  ["新竹", 24.80, 120.97, 8, "Asia/Taipei", "TW"], ["台中", 24.15, 120.67, 8, "Asia/Taipei", "TW"], ["彰化", 24.08, 120.54, 8, "Asia/Taipei", "TW"],
  ["嘉義", 23.48, 120.45, 8, "Asia/Taipei", "TW"], ["台南", 22.99, 120.21, 8, "Asia/Taipei", "TW"], ["高雄", 22.63, 120.30, 8, "Asia/Taipei", "TW"],
  ["屏東", 22.67, 120.49, 8, "Asia/Taipei", "TW"], ["宜蘭", 24.75, 121.75, 8, "Asia/Taipei", "TW"], ["花蓮", 23.99, 121.60, 8, "Asia/Taipei", "TW"],
  ["台東", 22.76, 121.14, 8, "Asia/Taipei", "TW"], ["澎湖", 23.57, 119.58, 8, "Asia/Taipei", "TW"], ["金門", 24.43, 118.32, 8, "Asia/Taipei", "TW"],
  ["香港", 22.32, 114.17, 8, "Asia/Hong_Kong", "HK"], ["澳門", 22.20, 113.55, 8, "Asia/Macau", "MO"], ["上海", 31.23, 121.47, 8, "Asia/Shanghai", "CN"],
  ["北京", 39.90, 116.40, 8, "Asia/Shanghai", "CN"], ["新加坡", 1.35, 103.82, 8, "Asia/Singapore", "SG"], ["吉隆坡", 3.14, 101.69, 8, "Asia/Kuala_Lumpur", "MY"],
  ["東京", 35.68, 139.69, 9, "Asia/Tokyo", "JP"], ["首爾", 37.57, 126.98, 9, "Asia/Seoul", "KR"], ["雪梨", -33.87, 151.21, 10, "Australia/Sydney", "AU"],
  ["倫敦", 51.51, -0.13, 0, "Europe/London", "GB"], ["紐約", 40.71, -74.01, -5, "America/New_York", "US"], ["洛杉磯", 34.05, -118.24, -8, "America/Los_Angeles", "US"],
  ["溫哥華", 49.28, -123.12, -8, "America/Vancouver", "CA"],
];
const LEGACY_EN = ["Taipei", "New Taipei", "Taoyuan", "Hsinchu", "Taichung", "Changhua", "Chiayi", "Tainan", "Kaohsiung", "Pingtung", "Yilan", "Hualien", "Taitung", "Penghu", "Kinmen",
  "Hong Kong", "Macau", "Shanghai", "Beijing", "Singapore", "Kuala Lumpur", "Tokyo", "Seoul", "Sydney", "London", "New York", "Los Angeles", "Vancouver"];

const TW_COUNTY = {
  TPE: "台北市", TPQ: "新北市", KEE: "基隆市", TAO: "桃園市", HSQ: "新竹市", HSZ: "新竹縣", MIA: "苗栗縣", TXG: "台中市", CHA: "彰化縣", NAN: "南投縣", YUN: "雲林縣",
  CYI: "嘉義市", CYQ: "嘉義縣", TNN: "台南市", KHH: "高雄市", PIF: "屏東縣", ILA: "宜蘭縣", HUA: "花蓮縣", TTT: "台東縣", PEN: "澎湖縣", KIN: "金門縣", LIE: "連江縣",
};
// 華人較多或常見移居的國家：人口 10 萬以上的城市都收錄；其他國家收錄 30 萬以上與首都
const DIASPORA = new Set(["MY", "SG", "HK", "MO", "JP", "KR", "US", "CA", "AU", "NZ", "GB", "TH", "VN", "PH", "ID", "DE", "FR"]);
// GeoNames 的國名不一定是台灣慣用說法
const COUNTRY_FIX = {
  US: "美國", GB: "英國", KR: "南韓", KP: "北韓", AU: "澳洲", NZ: "紐西蘭", IT: "義大利", CN: "中國", HK: "香港", MO: "澳門", IR: "伊朗", AE: "阿聯",
  LY: "利比亞", LA: "寮國", CZ: "捷克", SK: "斯洛伐克", MD: "摩爾多瓦", MK: "北馬其頓", BA: "波士尼亞與赫塞哥維納", ME: "蒙特內哥羅", KG: "吉爾吉斯",
  PS: "巴勒斯坦", MR: "茅利塔尼亞", VA: "梵蒂岡", NC: "新喀里多尼亞", MP: "北馬里亞納群島", DO: "多明尼加", CD: "剛果民主共和國", CG: "剛果共和國",
};
// 英文名本身就是當地慣用名的國家：沒有中文名的城市保留英文名，其他國家則不收錄
const KEEP_EN = new Set(["US", "CA", "AU", "NZ", "GB", "DE", "FR"]);
// 城市名稱去掉行政層級字尾（深圳市→深圳、釜山廣域市→釜山），但保留本身就帶「市」的名稱
const KEEP_SHI = new Set(["胡志明市", "吉林市", "奎松市", "達沃市"]);
// 簡轉繁的誤轉
const NAME_FIX = { 鬥湖: "斗湖" };
const cityName = (n) => (KEEP_SHI.has(n) ? n : n.replace(/(廣域市|特別市|特別自治市)$/, "").replace(/^(.{2,})市$/, "$1"));

async function* lines(file, member) {
  const p = spawn("unzip", ["-p", file, member]);
  const done = new Promise((ok, fail) => p.on("close", (code) => (code === 0 ? ok() : fail(new Error(`無法讀取 ${file}（unzip 結束碼 ${code}）`)))));
  for await (const line of createInterface({ input: p.stdout, crlfDelay: Infinity })) yield line.split("\t");
  await done;
}

const HAN = /[㐀-鿿]/;
// 從多語名稱挑出繁體中文名：優先 zh-TW／zh-Hant，再來是標為慣用名的 zh，排除舊名與俗稱
function pickZh(alts, suffix) {
  if (!alts) return null;
  const ok = alts.filter((a) => HAN.test(a.name) && !a.historic && !a.colloquial);
  const rank = (a) => (["zh-TW", "zh-Hant"].includes(a.lang) ? 0 : a.lang === "zh-HK" ? 1 : a.lang === "zh" && a.preferred ? 2 : a.lang === "zh" ? 3 : 4) - (suffix && a.name.endsWith(suffix) ? 10 : 0);
  ok.sort((a, b) => rank(a) - rank(b));
  return ok.length ? toTW(ok[0].name).replace(/臺/g, "台").replace(/鄕/g, "鄉") : null;
}

function stdOffset(tz) {
  const off = (d) => {
    const s = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(d).find((x) => x.type === "timeZoneName").value;
    const m = s.match(/GMT([+-])(\d{2}):?(\d{2})?/);
    return m ? (m[1] === "-" ? -1 : 1) * (+m[2] + (+m[3] || 0) / 60) : 0;
  };
  return Math.min(off(new Date(Date.UTC(2025, 0, 15))), off(new Date(Date.UTC(2025, 6, 15))));
}

// ---------- 讀取資料 ----------
const tw = [];
for await (const r of lines(`${SRC}/TW.zip`, "TW.txt")) if (r[7] === "ADM3") tw.push(r);
const overseas = [];
for await (const r of lines(`${SRC}/cities15000.zip`, "cities15000.txt")) {
  const cc = r[8], pop = +r[14] || 0;
  if (cc === "TW") continue;
  if (pop >= 300000 || r[7] === "PPLC" || (DIASPORA.has(cc) && pop >= 100000) || ["HK", "MO", "SG"].includes(cc)) overseas.push(r);
}
const countries = {};
for (const line of readFileSync(`${SRC}/countryInfo.txt`, "utf8").split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const f = line.split("\t");
  countries[f[0]] = { en: f[4], gid: f[16] };
}
const want = new Set([...tw.map((r) => r[0]), ...overseas.map((r) => r[0]), ...Object.values(countries).map((c) => c.gid)]);
const alt = {};
for await (const f of lines(`${SRC}/alternateNamesV2.zip`, "alternateNamesV2.txt")) {
  if (!want.has(f[1]) || !String(f[2]).startsWith("zh")) continue;
  (alt[f[1]] ??= []).push({ lang: f[2], name: f[3], preferred: f[4] === "1", colloquial: f[6] === "1", historic: f[7] === "1" });
}
const countryZh = (cc) => COUNTRY_FIX[cc] ?? pickZh(alt[countries[cc]?.gid]) ?? countries[cc]?.en ?? cc;

// ---------- 組合清單：[顯示名稱, 地區, 英文名, 緯度, 經度, 標準時區偏移, IANA 時區] ----------
const round = (v) => Math.round(+v * 100) / 100;
const list = LEGACY.map((c, i) => [c[0], countryZh(c[5]), LEGACY_EN[i], c[1], c[2], c[3], c[4]]);

const SUFFIX = { District: "區", City: "市", Township: "鄉", "Urban Township": "鎮" };
const twRows = tw.map((r) => {
  const county = TW_COUNTY[r[11]];
  if (!county) throw new Error(`找不到縣市代碼 ${r[11]}（${r[1]}）`);
  const suffix = Object.entries(SUFFIX).reverse().find(([en]) => r[1].endsWith(en))?.[1];
  const name = pickZh(alt[r[0]], suffix);
  if (!name) throw new Error(`找不到中文名稱：${r[1]}`);
  return [name, county, r[1], round(r[4]), round(r[5]), 8, "Asia/Taipei"];
}).sort((a, b) => Object.values(TW_COUNTY).indexOf(a[1]) - Object.values(TW_COUNTY).indexOf(b[1]) || a[0].localeCompare(b[0], "zh-Hant"));
list.push(...twRows);

const legacyKey = new Set(LEGACY.map((c) => `${c[0]}|${c[5]}`));
const seen = new Set();
overseas.sort((a, b) => (+b[14] || 0) - (+a[14] || 0));
for (const r of overseas) {
  const cc = r[8], zh = pickZh(alt[r[0]]);
  if (!zh && !KEEP_EN.has(cc)) continue;
  const name = zh ? (NAME_FIX[cityName(zh)] ?? cityName(zh)) : r[1];
  if (legacyKey.has(`${name}|${cc}`)) continue;
  const key = `${name}|${cc}`;
  if (seen.has(key)) continue; // 同國同名只留人口最多的一筆
  seen.add(key);
  list.push([name, countryZh(cc), r[2], round(r[4]), round(r[5]), stdOffset(r[17]), r[17]]);
}

// ---------- 輸出 ----------
const HEAD = "/* 出生地清單（由 scripts/cities/build.mjs 產生，請勿手動修改）。資料來源：GeoNames（CC BY 4.0）。";
const counties = new Set(Object.values(TW_COUNTY));
const server = list.map((c) => [counties.has(c[1]) ? c[1] + c[0] : `${c[0]}（${c[1]}）`, c[3], c[4], c[5], c[6]]);
// 舊版 28 筆的顯示名稱不變，報告上的出生地才會跟以前一致
for (let i = 0; i < LEGACY.length; i++) server[i][0] = LEGACY[i][0];
writeFileSync(`${ROOT}supabase/functions/_shared/cities.js`,
  `${HEAD}\n * 欄位：[報告顯示名稱, 緯度, 經度, 標準時區偏移(小時), IANA 時區]；編號即分享連結裡的 c 參數 */\n` +
    `(function(root){var C=${JSON.stringify(server)};root.CITY_DATA=C;if(typeof module!=="undefined"&&module.exports)module.exports=C})(typeof globalThis!=="undefined"?globalThis:this);\n`);
writeFileSync(`${ROOT}docs/assets/cities.js`,
  `${HEAD}\n * 欄位：[名稱, 地區, 英文名]；順序與伺服器端 supabase/functions/_shared/cities.js 相同 */\n` +
    `var CITY_LIST=${JSON.stringify(list.map((c) => [c[0], c[1], c[2]]))};\n`);
console.log(`共 ${list.length} 筆：舊版 ${LEGACY.length}、台灣鄉鎮市區 ${twRows.length}、海外 ${list.length - LEGACY.length - twRows.length}`);
execFileSync("node", ["--check", `${ROOT}docs/assets/cities.js`]);
