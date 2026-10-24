/* 網站設定：部署前請填入以下欄位（anon / publishable key 本來就是公開金鑰，可以放在前端） */
window.APP_CONFIG = {
  supabaseUrl: "https://jjdqueoldwjbbacoyzyb.supabase.co",
  supabaseAnonKey: "sb_publishable_3gkVqJegI3foI7qP0rgX-A_wah27Ggq",

  // 付款資訊：會顯示在「升級」視窗。QR code 圖片放在 docs/assets/ 底下，沒有圖片就留空字串
  payment: {
    linepay: { label: "LINE Pay", account: "請填入 LINE Pay 帳號或手機號碼", qr: "" },
    jkopay:  { label: "街口支付", account: "請填入街口帳號", qr: "" },
    bank:    { label: "銀行匯款", bank: "請填入銀行代碼與名稱", account: "請填入帳號", name: "請填入戶名" }
  },
  contactEmail: "請填入客服信箱"
};
