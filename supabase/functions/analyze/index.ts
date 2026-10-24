// 職運羅盤 analyze：依會員等級回傳排盤結果。
// 等級一律由資料庫判斷，前端傳來的任何等級資訊都不採信。
import lunar from "npm:lunar-javascript@1.7.3";
import { astro } from "npm:iztro@2.5.8";
import * as Astronomy from "npm:astronomy-engine@2.1.19";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";
import "../_shared/engine.js";

// deno-lint-ignore no-explicit-any
const engine = (globalThis as any).createEngine({
  Solar: lunar.Solar,
  LunarUtil: lunar.LunarUtil,
  iztro: { astro },
  Astronomy,
});

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

async function tierOf(req: Request): Promise<string> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return "free";
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return "free";
  const { data: p } = await admin.from("profiles").select("tier, tier_expires_at").eq("id", data.user.id).single();
  if (!p) return "free";
  if (p.tier_expires_at && new Date(p.tier_expires_at) <= new Date()) return "free";
  return p.tier;
}

Deno.serve(async (req) => {
  const headers = { ...cors(req.headers.get("Origin")), "Content-Type": "application/json; charset=utf-8" };
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "只接受 POST" }), { status: 405, headers });
  try {
    const body = await req.json();
    const tier = await tierOf(req);
    const result = engine.runAction(String(body.action ?? "report"), body.input, tier, body.params ?? {}, new Date());
    return new Response(JSON.stringify({ tier, result }), { headers });
  } catch (e) {
    // deno-lint-ignore no-explicit-any
    const err = e as any;
    const status = err?.code === "forbidden" ? 403 : err?.code === "bad_request" ? 400 : 500;
    if (status === 500) console.error(err);
    return new Response(JSON.stringify({ error: status === 500 ? "排盤時發生錯誤，請稍後再試" : err.message, need: err?.need ?? null }), { status, headers });
  }
});
