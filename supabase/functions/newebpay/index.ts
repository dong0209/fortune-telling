// 職運羅盤 newebpay：藍新金流信用卡定期定額（每月自動扣款）
//   POST /newebpay/create  會員建立每月贊助，回傳要送往藍新的表單欄位
//   POST /newebpay/cancel  會員取消每月贊助（向藍新終止委託，已付的期間照常可用）
//   POST /newebpay/return  藍新付款完成後，瀏覽器帶著結果回到這裡，處理後導回網站
//   POST /newebpay/notify  藍新每期扣款後的背景通知
// 藍新的金鑰只存在 Supabase secrets；扣款結果必須能用金鑰解密才會採信。
import { createClient } from "npm:@supabase/supabase-js@2.112.4";
import { decrypt as aesDecrypt, encrypt as aesEncrypt } from "../_shared/newebpay.ts";

const MERCHANT_ID = Deno.env.get("NEWEBPAY_MERCHANT_ID") ?? "";
const HASH_KEY = Deno.env.get("NEWEBPAY_HASH_KEY") ?? "";
const HASH_IV = Deno.env.get("NEWEBPAY_HASH_IV") ?? "";
const GATEWAY = Deno.env.get("NEWEBPAY_ENV") === "production" ? "https://core.newebpay.com" : "https://ccore.newebpay.com";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://dong0209.github.io/fortune-telling/";
const SELF_URL = Deno.env.get("SUPABASE_URL") + "/functions/v1/newebpay";
const PLAN_DESC: Record<string, string> = { paid: "職運羅盤付費版每月贊助", vip: "職運羅盤VIP版每月贊助" };

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "*").split(",").map((s) => s.trim());

function cors(origin: string | null) {
  const allow = ALLOWED_ORIGINS.includes("*") ? "*" : (origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const encrypt = (params: Record<string, string | number>) => aesEncrypt(params, HASH_KEY, HASH_IV);
const decrypt = (hex: string) => aesDecrypt(hex, HASH_KEY, HASH_IV);

/* ---------- 日期：藍新回傳台灣時間 ---------- */
function taipeiParts(d = new Date()) {
  const p: Record<string, string> = {};
  new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(d).forEach((x) => (p[x.type] = x.value));
  return p;
}
// 接受 "2026-10-24 12:34:56"、"20261024123456" 等格式
function parseTaipeiTime(s: unknown): string | null {
  const m = String(s ?? "").replace(/\D/g, "").match(/^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4] ?? "00"}:${m[5] ?? "00"}:${m[6] ?? "00"}+08:00`;
}
function parseDate(s: unknown): string | null {
  const m = String(s ?? "").replace(/\D/g, "").match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/* ---------- 會員 ---------- */
async function userOf(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "請先登入");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "登入已過期，請重新登入");
  return data.user;
}

function orderNo(): string {
  const p: Record<string, string> = {};
  new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Taipei", hourCycle: "h23", year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .formatToParts(new Date()).forEach((x) => (p[x.type] = x.value));
  const rand = crypto.getRandomValues(new Uint8Array(4)).reduce((s, b) => s + b.toString(36).padStart(2, "0"), "").slice(0, 6).toUpperCase();
  return `P${p.year}${p.month}${p.day}${p.hour}${p.minute}${p.second}${rand}`;
}

async function create(req: Request) {
  const user = await userOf(req);
  const { plan } = await req.json();
  const { data: pl } = await admin.from("plans").select("id, price").eq("id", plan).single();
  if (!pl) throw new HttpError(400, "找不到這個方案");

  const { data: profile } = await admin.from("profiles").select("tier, tier_expires_at").eq("id", user.id).single();
  const vipActive = profile?.tier === "vip" && profile.tier_expires_at && new Date(profile.tier_expires_at) > new Date();
  if (vipActive && plan === "paid") throw new HttpError(400, "你目前是有效的 VIP，不需要另外贊助付費版");
  const { data: same } = await admin.from("subscriptions").select("id").eq("user_id", user.id).eq("plan", plan).eq("status", "active").limit(1);
  if (same?.length) throw new HttpError(400, "你已經有這個方案的每月贊助了");

  const no = orderNo();
  const { error } = await admin.from("subscriptions").insert({ user_id: user.id, plan, amount: pl.price, mer_order_no: no });
  if (error) throw error;

  // 每月扣款日固定為今天的日期；29～31 日改在 28 日，避免短月份的扣款日不固定
  const day = Math.min(+taipeiParts().day, 28);
  const postData = encrypt({
    RespondType: "JSON",
    TimeStamp: Math.floor(Date.now() / 1000),
    Version: "1.5",
    LangType: "zh-Tw",
    MerOrderNo: no,
    ProdDesc: PLAN_DESC[plan],
    PeriodAmt: pl.price,
    PeriodType: "M",
    PeriodPoint: String(day).padStart(2, "0"),
    PeriodStartType: 2, // 立即授權第一期金額
    PeriodTimes: 99, // 月繳最多 99 期，會員可隨時取消
    PayerEmail: user.email ?? "",
    EmailModify: 0,
    PaymentInfo: "N",
    OrderInfo: "N",
    ReturnURL: `${SELF_URL}/return`,
    NotifyURL: `${SELF_URL}/notify`,
    BackURL: SITE_URL,
  });
  return { action: `${GATEWAY}/MPG/period`, fields: { MerchantID_: MERCHANT_ID, PostData_: postData } };
}

// 向藍新終止委託；終止後不能恢復
async function terminate(sub: { id: string; mer_order_no: string; period_no: string | null }) {
  // 沒有委託單號就無法通知藍新停止扣款，不能只改本站的狀態
  if (!sub.period_no) throw new HttpError(409, "找不到藍新委託單號，請來信客服協助取消");
  const body = new URLSearchParams({
    MerchantID_: MERCHANT_ID,
    PostData_: encrypt({ RespondType: "JSON", Version: "1.0", TimeStamp: Math.floor(Date.now() / 1000), MerOrderNo: sub.mer_order_no, PeriodNo: sub.period_no, AlterType: "terminate" }),
  });
  const res = await fetch(`${GATEWAY}/MPG/period/AlterStatus`, { method: "POST", body });
  const text = await res.text();
  let status = "", message = text.slice(0, 200);
  try {
    const j = JSON.parse(text);
    const r = j.period ? decrypt(j.period) : j;
    status = r.Status;
    message = r.Message;
  } catch {
    const q = new URLSearchParams(text);
    status = q.get("Status") ?? "";
    message = q.get("Message") ?? message;
  }
  if (status !== "SUCCESS") throw new HttpError(502, `藍新終止委託失敗：${message || status}`);
  await admin.from("subscriptions").update({ status: "terminated", terminated_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", sub.id);
}

async function cancel(req: Request) {
  const user = await userOf(req);
  const { id } = await req.json();
  const { data: sub } = await admin.from("subscriptions").select("id, mer_order_no, period_no, status").eq("id", id).eq("user_id", user.id).single();
  if (!sub || sub.status !== "active") throw new HttpError(400, "找不到進行中的每月贊助");
  await terminate(sub);
  return { ok: true };
}

// 新的委託第一期扣款成功後，終止同一位會員其他進行中的委託（例如付費版升級 VIP）
async function terminateOthers(merOrderNo: string) {
  const { data: sub } = await admin.from("subscriptions").select("id, user_id").eq("mer_order_no", merOrderNo).single();
  if (!sub) return;
  const { data: others } = await admin.from("subscriptions").select("id, mer_order_no, period_no").eq("user_id", sub.user_id).eq("status", "active").neq("id", sub.id);
  for (const o of others ?? []) {
    try {
      await terminate(o);
    } catch (e) {
      console.error("終止舊委託失敗", o.mer_order_no, e);
    }
  }
}

// deno-lint-ignore no-explicit-any
async function record(r: any, success: boolean, message: string, times: number | null, authAt: unknown, next: string | null) {
  const { data, error } = await admin.rpc("record_subscription_charge", {
    p_mer_order_no: r.MerchantOrderNo ?? r.MerOrderNo,
    p_trade_no: r.TradeNo ?? null,
    p_amount: Number(r.AuthAmt ?? r.PeriodAmt ?? 0) || null,
    p_success: success,
    p_message: message,
    p_times: times,
    p_auth_at: parseTaipeiTime(authAt),
    p_next_auth_date: next,
  });
  if (error) throw error;
  return data as string;
}

// 藍新付款頁完成後，瀏覽器帶著第一期結果回來
async function handleReturn(form: FormData): Promise<string> {
  const j = decrypt(String(form.get("Period") ?? ""));
  const r = j.Result ?? {};
  const no = r.MerchantOrderNo ?? r.MerOrderNo;
  if (!no || (r.MerchantID && r.MerchantID !== MERCHANT_ID)) return "fail";
  const ok = j.Status === "SUCCESS" && (r.RespondCode === undefined || r.RespondCode === "00");
  const dates = String(r.DateArray ?? "").split(",").map(parseDate).filter(Boolean);
  await admin.from("subscriptions").update({
    period_no: r.PeriodNo ?? null,
    status: ok ? "active" : "failed",
    message: String(j.Message ?? "").slice(0, 200),
    next_auth_date: dates[1] ?? null,
    updated_at: new Date().toISOString(),
  }).eq("mer_order_no", no).in("status", ["pending", "failed"]);
  if (r.TradeNo) await record(r, ok, String(j.Message ?? ""), 1, r.AuthTime, dates[1] ?? null);
  if (ok) await terminateOthers(no);
  return ok ? "success" : "fail";
}

// 每期扣款後藍新的背景通知
async function handleNotify(form: FormData) {
  const j = decrypt(String(form.get("Period") ?? ""));
  const r = j.Result ?? {};
  if (r.MerchantID && r.MerchantID !== MERCHANT_ID) throw new HttpError(400, "MerchantID 不符");
  const ok = j.Status === "SUCCESS" && (r.RespondCode === undefined || r.RespondCode === "00");
  const result = await record(r, ok, String(j.Message ?? ""), Number(r.AlreadyTimes) || null, r.AuthDate, parseDate(r.NextAuthDate));
  if (r.PeriodNo) await admin.from("subscriptions").update({ period_no: r.PeriodNo }).eq("mer_order_no", r.MerchantOrderNo).is("period_no", null);
  if (ok && Number(r.AlreadyTimes) === 1) await terminateOthers(r.MerchantOrderNo);
  console.log("newebpay notify", r.MerchantOrderNo, r.AlreadyTimes, j.Status, result);
}

Deno.serve(async (req) => {
  const route = new URL(req.url).pathname.split("/").filter(Boolean).pop();
  const headers = { ...cors(req.headers.get("Origin")), "Content-Type": "application/json; charset=utf-8" };
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "只接受 POST" }), { status: 405, headers });
  if (!MERCHANT_ID || !HASH_KEY || !HASH_IV) return new Response(JSON.stringify({ error: "信用卡每月贊助尚未設定" }), { status: 503, headers });

  if (route === "return") {
    let result = "fail";
    try {
      result = await handleReturn(await req.formData());
    } catch (e) {
      console.error(e);
    }
    const url = new URL(SITE_URL);
    url.searchParams.set("pay", result);
    return new Response(null, { status: 303, headers: { Location: url.toString() } });
  }
  if (route === "notify") {
    try {
      await handleNotify(await req.formData());
      return new Response("OK");
    } catch (e) {
      console.error(e);
      return new Response("ERROR", { status: 400 });
    }
  }
  try {
    const body = route === "create" ? await create(req) : route === "cancel" ? await cancel(req) : null;
    if (!body) throw new HttpError(404, "找不到這個功能");
    return new Response(JSON.stringify(body), { headers });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error(e);
    return new Response(JSON.stringify({ error: status === 500 ? "處理時發生錯誤，請稍後再試" : (e as Error).message }), { status, headers });
  }
});
