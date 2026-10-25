// 以 Node 載入伺服器端的排盤引擎，套件版本與 supabase/functions/analyze/index.ts 相同
import { createRequire } from "node:module";
// 伺服器以 UTC 運作；在其他時區的電腦上跑測試也要得到一樣的結果
process.env.TZ = "UTC";
const require = createRequire(import.meta.url);
const lunar = require("lunar-javascript");
const { astro } = require("iztro");
const Astronomy = require("astronomy-engine");
require("../supabase/functions/_shared/strokes.js");
export const CITY_DATA = require("../supabase/functions/_shared/cities.js");
const createEngine = require("../supabase/functions/_shared/engine.js");

export const engine = createEngine({ Solar: lunar.Solar, LunarUtil: lunar.LunarUtil, iztro: { astro }, Astronomy, strokes: globalThis.KANGXI_STROKES });
// 固定「現在」，讓跟今天有關的內容（流年、時機曲線）每次都一樣
export const NOW = new Date("2026-01-15T12:00:00+08:00");
export const cityIndex = (label) => {
  const i = CITY_DATA.findIndex((c) => c[0] === label);
  if (i < 0) throw new Error(`清單裡沒有 ${label}`);
  return i;
};
export function report(input, tier = "free") {
  return engine.runAction("report", { gender: "女", q: "move", yrs: 1, ...input }, tier, {}, NOW);
}
