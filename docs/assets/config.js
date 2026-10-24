/* 網站設定：部署前請填入以下欄位（anon / publishable key 本來就是公開金鑰，可以放在前端） */
window.APP_CONFIG = {
  supabaseUrl: "https://jjdqueoldwjbbacoyzyb.supabase.co",
  supabaseAnonKey: "sb_publishable_3gkVqJegI3foI7qP0rgX-A_wah27Ggq",

  // 贊助收款資訊：會顯示在「贊助支持」視窗。account 留空的方式不會顯示。
  // QR code 圖片放在 docs/assets/ 底下（例如 "assets/pay-jkopay.png"），沒有圖片就留空字串
  payment: {
    jkopay:  { label: "街口支付", account: "(396) 900726891", qr: "" },
    bank:    { label: "銀行轉帳", bank: "396 街口電子支付", account: "900726891", name: "" },
    linepay: { label: "LINE Pay", account: "", qr: "" }
  },
  contactEmail: ""   // 客服信箱，留空則不顯示
};
