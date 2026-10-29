// 範例報告：虛構人物張三豐的排盤結果，供網站 ?sample=free|paid|vip 展示各等級實際看到的內容
import { cityIndex, engine } from "./engine.mjs";

export const SAMPLE = {
  person: { name: "張三豐", note: "虛構人物" },
  input: { date: "1988-04-08", time: "10:30", noTime: false, gender: "男", city: cityIndex("台北"), q: "move", yrs: 3, name: "張三豐", solar: true },
  // 「今天」固定為這個日期（台灣時間正午），每日運勢、時機曲線都以此為準
  today: "2026-10-25",
};
const DEFAULT_SYSTEMS = { paid: ["bazi", "ziwei"], vip: ["bazi", "ziwei", "astro", "iching", "meihua"] };

// 伺服器傳給引擎的「現在」是台灣時間的鐘錶時刻（見 analyze/index.ts 的 taipeiNow）
export function sampleNow() {
  const [y, m, d] = SAMPLE.today.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function buildSample(tier) {
  const now = sampleNow(), run = (action, params) => engine.runAction(action, SAMPLE.input, tier, params, now);
  const out = { person: SAMPLE.person, input: SAMPLE.input, today: SAMPLE.today, tier, report: run("report", {}) };
  // 交叉比對從付費版開始；免費版只看報告裡的學派投票結果
  if (tier !== "free") {
    out.compare = run("compare", { systems: DEFAULT_SYSTEMS[tier] });
    out.month = out.report.months.map((_, i) => run("month", { i }));
  }
  if (tier === "vip") out.qimenDay = run("qimenDay", { date: SAMPLE.today });
  return out;
}
