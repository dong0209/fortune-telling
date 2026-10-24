// 藍新金流加解密：AES-256-CBC，十六進位字串
import { createCipheriv, createDecipheriv } from "node:crypto";

export function encrypt(params: Record<string, string | number>, key: string, iv: string): string {
  const c = createCipheriv("aes-256-cbc", key, iv);
  const text = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  return c.update(text, "utf8", "hex") + c.final("hex");
}

// 藍新回傳的資料不一定是標準 PKCS7 補位，關閉自動補位後自行去掉尾端的補位字元
// deno-lint-ignore no-explicit-any
export function decrypt(hex: string, key: string, iv: string): any {
  // 長度不是區塊倍數的密文會讓 Deno 的解密直接崩潰（不是丟出例外），先檢查格式
  hex = hex.trim();
  if (!/^(?:[0-9a-fA-F]{32})+$/.test(hex)) throw new Error("藍新回傳資料格式不正確");
  const d = createDecipheriv("aes-256-cbc", key, iv);
  d.setAutoPadding(false);
  const text = d.update(hex, "hex", "utf8") + d.final("utf8");
  // deno-lint-ignore no-control-regex
  return JSON.parse(text.replace(/[\x00-\x20]+$/, ""));
}
