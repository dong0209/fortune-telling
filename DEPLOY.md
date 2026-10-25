# 部署指南

網站分成兩部分：

- **前端**（`docs/`）：放在 Cloudflare Pages（免費、可商用），負責畫面。
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
3. 接著再貼上 `supabase/migrations/20261024120000_sponsorship.sql` 執行，把方案改成贊助名義：贊助 NT$899 協助測試付費版、贊助 NT$2,399 協助測試 VIP 版，測試權限 365 天。
4. 最後貼上 `supabase/migrations/20261025000000_plan_descriptions.sql` 與 `supabase/migrations/20261026000000_newebpay_period.sql` 執行。後者會把方案改成每月贊助（付費版 NT$899、VIP NT$2,399），並建立信用卡每月贊助用的資料表；街口、轉帳單次贊助改為每次開通 30 天。
5. 之後要調整金額或天數，到 **Table Editor → plans** 直接改 `price`、`days`、`description` 即可，網站會即時讀取。

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
npx supabase secrets set ALLOWED_ORIGINS=https://fortune-telling-dss.pages.dev
```

網址要跟瀏覽器網址列的開頭完全一樣（不含結尾的 `/`）。有多個網址時用逗號分隔，例如搬家期間新舊網址並存：`ALLOWED_ORIGINS=https://fortune-telling-dss.pages.dev,https://dong0209.github.io`。

### 更新排盤程式時

`supabase/functions/` 底下的檔案有變動（例如出生地清單 `_shared/cities.js`），要在自己的電腦重新部署：

```bash
git pull
npx supabase functions deploy analyze --no-verify-jwt
```

⚠️ **先部署函式，再合併前端。** 網頁送出的出生地是清單編號；如果網頁已經換成新清單、伺服器還是舊清單，新加入的地點會被當成台北排盤。新版函式仍然認得舊編號，所以先部署函式不會影響目前的網站。

## 4. 設定登入信

1. 到 **Authentication → URL Configuration**：
   - **Site URL** 填 `https://fortune-telling-dss.pages.dev/`
   - **Redirect URLs** 加入 `https://fortune-telling-dss.pages.dev/**`
2. Supabase 內建的寄信服務每小時只能寄很少封，只適合測試。正式上線前，請到 **Authentication → Emails → SMTP Settings** 設定自己的寄信服務（例如 Resend、Brevo，都有免費額度）。
3. （選用）到 **Authentication → Emails → Templates → Magic Link**，把信件內容改成中文。

## 5. 填寫網站設定

編輯 `docs/assets/config.js`：

- `supabaseUrl`、`supabaseAnonKey`：填第 1 步記下的兩個值。
- `payment`：填你的 LINE Pay、街口帳號與匯款帳戶。
  - 有收款 QR code 的話，把圖片放到 `docs/assets/`（例如 `pay-linepay.png`），再把檔名填進 `qr` 欄位。
- `contactEmail`：客服信箱，會顯示在升級視窗和隱私權頁。

另外，`docs/privacy.html` 是隱私權與付費條款的範本，請依實際狀況修改。

## 6. 用 Cloudflare Pages 發布網站

GitHub Pages 的使用條款不允許以收款為主的商業網站，所以前端放在 Cloudflare Pages（免費、可商用、流量不限）。

1. 到 <https://dash.cloudflare.com> 登入，選 **Workers & Pages → Create → Pages → Connect to Git**，授權 GitHub 並選這個 repo。
2. 建置設定：
   - **Production branch**：`main`
   - **Framework preset**：None
   - **Build command**：留空
   - **Build output directory**：`docs`
3. 按 **Save and Deploy**。之後每次合併到 `main`，Cloudflare 都會自動重新發布。

目前的網址是 `https://fortune-telling-dss.pages.dev/`。網址改變時（例如換成自己的網域），要一起更新：

- 第 3 步的 `ALLOWED_ORIGINS`
- 第 4 步的 Site URL 與 Redirect URLs
- 第 9 步藍新函式的 `SITE_URL`（付款完成後導回的網址）

確認新網址一切正常後，到 GitHub repo 的 **Settings → Pages** 把 GitHub Pages 關掉，並把舊網址從 `ALLOWED_ORIGINS` 和 Redirect URLs 移除。

## 7. 設定自己為管理員

1. 打開網站，用你的 Email 登入一次（會自動建立帳號）。
2. 回到 Supabase 的 **SQL Editor** 執行：

   ```sql
   update public.profiles set is_admin = true where email = '你的信箱';
   ```

3. 重新整理網站，右上角會出現「管理後台」連結（網址是 `admin.html`）。

## 8. 防止 Supabase 免費專案被暫停

Supabase 免費專案連續 7 天沒有任何請求就會被暫停。repo 內的 `.github/workflows/keep-alive.yml` 每天會自動讀一次方案表，讓專案保持喚醒。網址與金鑰會直接從 `config.js` 讀取，不需要另外設定。

- 到 GitHub repo 的 **Actions** 分頁，確認 **Supabase keep-alive** 有啟用。可以按 **Run workflow** 手動跑一次測試。
- GitHub 會自動停用「repo 超過 60 天沒有新 commit」的排程。如果很久沒更新網站，記得回來重新啟用。

## 9. 信用卡每月贊助（藍新金流定期定額）

用戶在網站刷卡後，藍新每月自動扣款並通知伺服器，伺服器確認扣款成功就把會員延長 1 個月，不需要人工核對。

### 9-1 藍新後台

1. 確認商店已開通 **信用卡定期定額** 服務（跟一般信用卡收款分開申請）。
2. 到商店管理找到該商店的 **MerchantID**、**HashKey**、**HashIV**。
   - 測試環境（<https://cwww.newebpay.com>）和正式環境（<https://www.newebpay.com>）的帳號與金鑰是分開的。
   - ⚠️ 這三組值是機密，**不要放進網頁或 GitHub**，只存在 Supabase secrets。

### 9-2 設定金鑰並部署函式

先用測試環境的金鑰：

```bash
npx supabase secrets set NEWEBPAY_MERCHANT_ID=你的MerchantID NEWEBPAY_HASH_KEY=你的HashKey NEWEBPAY_HASH_IV=你的HashIV NEWEBPAY_ENV=test
npx supabase functions deploy newebpay --no-verify-jwt
```

- 函式會把付款結果導回 `https://fortune-telling-dss.pages.dev/`。網址不同的話，再加設 `SITE_URL=你的網站網址`。
- 先前設定的 `ALLOWED_ORIGINS` 也會套用到這個函式。

### 9-3 開啟網站上的信用卡選項

把 `docs/assets/config.js` 的 `cardPayment` 改成 `true`，「贊助支持」視窗就會出現「信用卡每月贊助」。

### 9-4 用測試卡跑一次

1. 用自己的帳號登入網站，打開「贊助支持」，選方案後按「前往藍新付款」。
2. 在藍新測試付款頁輸入測試卡號 `4000-2211-1111-1111`，有效期限填未來任一月份，背面末三碼任意。
3. 付款完成後會回到網站並顯示「付款成功」，權限立即開通。
4. 到管理後台確認「信用卡每月贊助」出現一筆「扣款中」，扣款紀錄有第 1 期。
5. 在「贊助支持」按「取消每月贊助」，確認狀態變成「已終止」。

### 9-5 切換到正式環境

```bash
npx supabase secrets set NEWEBPAY_MERCHANT_ID=正式MerchantID NEWEBPAY_HASH_KEY=正式HashKey NEWEBPAY_HASH_IV=正式HashIV NEWEBPAY_ENV=production
```

設定 secrets 後不用重新部署，下一次呼叫就會使用新的值。

### 運作規則

- 每月扣款日固定為第一次付款的日期；29～31 日付款的人固定在每月 28 日扣款。
- 第一期成功：從當下起算 1 個月，另加 3 天寬限，避免每月扣款時間稍晚於到期時間而短暫失去權限。之後每期成功都從原到期日往後加 1 個月。
- 扣款失敗不會延長，到期後自動回到基礎版。失敗紀錄會出現在管理後台。
- 付費版升級 VIP：VIP 首期扣款成功後，系統會自動向藍新終止付費版的委託。
- 藍新的每期扣款通知必須能用 HashKey、HashIV 解密，金額也要跟方案相符，才會延長會員，所以無法偽造付款成功。
- 要手動停止某位會員的扣款，可以到藍新後台的定期定額委託管理終止。之後再請會員到「贊助支持」確認，或在 Supabase 的 `subscriptions` 表把狀態改成 `terminated`。

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
- **信用卡每月贊助**：卡號只在藍新的付款頁輸入，不經過本站。扣款結果必須能用藍新金鑰解密才會採信，資料表只有伺服器函式能寫入。
- **公開 repo 的限制**：這個 repo 是公開的，所以排盤程式碼本身看得到。懂技術的人可以自己架一份來用，但無法透過你的網站免費取得付費內容。如果要連程式碼一起保護：
  - 把 repo 改成私人即可。Cloudflare Pages 支援私人 repo，免費方案就能用。
