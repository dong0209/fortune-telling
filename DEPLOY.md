# 部署指南

網站分成兩部分：

- **前端**（`docs/`）：放在 GitHub Pages，負責畫面。
- **後端**（`supabase/`）：放在 Supabase，負責會員登入、付款回報，以及所有排盤計算。網頁只會拿到符合會員等級的結果。

整個流程大約 30 分鐘，Supabase 免費方案就夠用。

---

## 1. 建立 Supabase 專案

1. 到 <https://supabase.com> 註冊並建立新專案。
   - Region 建議選 **Northeast Asia (Tokyo)** 或 **Southeast Asia (Singapore)**，離台灣近。
   - 資料庫密碼請自己保存好。
2. 專案建好後，到 **Project Settings → API Keys** 記下兩個值，第 5 步會用到：
   - **Project URL**（例如 `https://abcdefgh.supabase.co`）
   - **anon / publishable key**（這把是公開金鑰，可以放在網頁裡）

> ⚠️ **service_role / secret key 絕對不要放進網頁或 GitHub。** 伺服器函式會自動取得它，你不需要手動設定。

## 2. 建立資料表

1. 打開 Supabase 後台的 **SQL Editor → New query**。
2. 把 `supabase/migrations/20261024000000_membership.sql` 的內容整份貼上，按 **Run**。
3. 價格與天數預設是「付費版 NT$299／365 天」「VIP NT$699／365 天」。要修改的話，到 **Table Editor → plans** 直接改 `price`、`days`、`description` 即可，網站會即時讀取。

## 3. 部署排盤函式

需要在自己的電腦上執行（需先安裝 [Node.js](https://nodejs.org)）：

```bash
git clone https://github.com/dong0209/fortune-telling.git
cd fortune-telling
npx supabase login                               # 會開瀏覽器授權
npx supabase link --project-ref 你的專案代號        # 代號就是 Project URL 裡 https:// 後面那串
npx supabase functions deploy analyze --no-verify-jwt
```

建議再限制只有你的網站能呼叫這個函式：

```bash
npx supabase secrets set ALLOWED_ORIGINS=https://dong0209.github.io
```

## 4. 設定登入信

1. 到 **Authentication → URL Configuration**：
   - **Site URL** 填 `https://dong0209.github.io/fortune-telling/`
   - **Redirect URLs** 加入 `https://dong0209.github.io/fortune-telling/**`
2. Supabase 內建的寄信服務每小時只能寄很少封，只適合測試。正式上線前，請到 **Authentication → Emails → SMTP Settings** 設定自己的寄信服務（例如 Resend、Brevo，都有免費額度）。
3. （選用）到 **Authentication → Emails → Templates → Magic Link**，把信件內容改成中文。

## 5. 填寫網站設定

編輯 `docs/assets/config.js`：

- `supabaseUrl`、`supabaseAnonKey`：填第 1 步記下的兩個值。
- `payment`：填你的 LINE Pay、街口帳號與匯款帳戶。
  - 有收款 QR code 的話，把圖片放到 `docs/assets/`（例如 `pay-linepay.png`），再把檔名填進 `qr` 欄位。
- `contactEmail`：客服信箱，會顯示在升級視窗和隱私權頁。

另外，`docs/privacy.html` 是隱私權與付費條款的範本，請依實際狀況修改。

## 6. 開啟 GitHub Pages

到 GitHub repo 的 **Settings → Pages**：

- Source：**Deploy from a branch**
- Branch：**main**，資料夾選 **/docs**

約一分鐘後，網站會出現在 `https://dong0209.github.io/fortune-telling/`。

## 7. 設定自己為管理員

1. 打開網站，用你的 Email 登入一次（會自動建立帳號）。
2. 回到 Supabase 的 **SQL Editor** 執行：

   ```sql
   update public.profiles set is_admin = true where email = '你的信箱';
   ```

3. 重新整理網站，右上角會出現「管理後台」連結（網址是 `admin.html`）。

---

## 日常營運：開通會員

1. 用戶在網站按「升級」，付款後填寫付款回報（匯款末五碼或交易編號）。
2. 你到 **管理後台** 看到待審核的回報，對照 LINE Pay、街口或銀行的入帳紀錄。
3. 確認收到款項就按「核准開通」，系統會自動設定等級與到期日。
   - 同方案續約：從原到期日往後累加。
   - 付費版升級 VIP：從核准日起算。
4. 款項對不上就填寫原因並按「退回」，用戶會在升級視窗看到原因。

## 安全性說明

- **會員等級**：一律由伺服器查資料庫決定。前端改不了等級，也無法直接拿到付費內容。
- **付款回報**：金額由資料庫依方案價格自動填入。只有管理員能核准或退回。
- **公開 repo 的限制**：這個 repo 是公開的，所以排盤程式碼本身看得到。懂技術的人可以自己架一份來用，但無法透過你的網站免費取得付費內容。如果要連程式碼一起保護：
  - 方法一：把 repo 改成私人。GitHub Pages 用在私人 repo 需要 GitHub Pro。
  - 方法二：把前端改放到 Cloudflare Pages，它支援私人 repo，而且免費。
