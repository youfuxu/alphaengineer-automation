# 新平台帳號申請與 API 串接指南

## 狀態總覽

| 平台 | 帳號 | API Secrets | 自動發文 |
|------|------|------------|---------|
| Instagram | ✅ @alphaengineer.ai | ✅ 已設定 | ✅ 運作中 |
| Threads | ⬜ 待申請 | ⬜ 待設定 | 💤 設定後立即啟用 |
| TikTok | ⬜ 待申請 | ⬜ API 審核中（需數天）| 💤 審核通過後啟用 |
| YouTube | ⬜ 待申請 | ⬜ 待設定 | 💤 設定後立即啟用 |

---

## Threads

### 1. 建立帳號
- 用手機 App 或網頁 threads.net 登入，**直接用 @alphaengineer.ai 的 Instagram 帳號授權**即可，Threads 帳號 username 會自動對應 @alphaengineer.ai

### 2. 在 Meta Developer App 加入 Threads
1. 進 Meta Developer Console → App「AlphaEngineer Bot」
2. 左側 Add Product → **Threads**
3. Threads → App Settings → 把 Threads 帳號加進 Testers（測試期間）

### 3. 取得 Threads Access Token
```
https://graph.threads.net/oauth/authorize
  ?client_id={app_id}
  &redirect_uri=https://youfuxu.github.io/alphaengineerai-landing
  &scope=threads_basic,threads_content_publish
  &response_type=code
```
1. 瀏覽器開上面網址 → 登入 → 授權
2. 複製網址列的 `?code=` 後面的 code
3. 用 code 換 access token：
   ```bash
   curl -X POST https://graph.threads.net/oauth/access_token \
     -F client_id={app_id} \
     -F client_secret={app_secret} \
     -F grant_type=authorization_code \
     -F redirect_uri=https://youfuxu.github.io/alphaengineerai-landing \
     -F code={code}
   ```
4. 換成 Long-lived token（有效期 60 天）：
   ```bash
   curl "https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret={app_secret}&access_token={short_token}"
   ```
5. 取得 Threads User ID：
   ```bash
   curl "https://graph.threads.net/v1.0/me?access_token={token}"
   ```

### 4. 加入 GitHub Secrets
| Secret Name | Value |
|-------------|-------|
| `THREADS_ACCESS_TOKEN` | 上方取得的 long-lived token |
| `THREADS_USER_ID` | me API 回傳的 id 欄位 |

**完成後下次 GitHub Actions 執行即自動發文到 Threads。**

---

## TikTok

### 1. 建立帳號
- 下載 TikTok App 或到 tiktok.com，用 `alpha-engineer@hotmail.com` 註冊
- 帳號名稱設定為 `@alphaengineer.ai`（或接近的名稱）
- 切換為「創作者帳號」（Creator Account）

### 2. 申請開發者資格
1. 到 https://developers.tiktok.com → 用 TikTok 帳號登入
2. 建立 App：名稱「Alpha Engineer Bot」，Platform：Web
3. 申請以下 Permissions（在 App → Products → Login Kit → Add scopes）：
   - `video.publish`（發文用）
4. 同時申請 **Content Posting API** access（需填寫使用情境，說明是個人帳號自動化發文）

> ⚠️ **TikTok 審核需要 3-7 天**，提交後等待 email 通知

### 3. 取得 OAuth 憑證（審核通過後）
1. App → Credentials 取得 Client Key 和 Client Secret
2. 執行 OAuth 授權流程取得 refresh token（需要一次性手動操作）：
   ```
   GET https://www.tiktok.com/v2/auth/authorize/
     ?client_key={client_key}
     &response_type=code
     &scope=video.publish
     &redirect_uri=https://youfuxu.github.io/alphaengineerai-landing
     &state=random_string
   ```
3. 複製 code，換 refresh token：
   ```bash
   curl -X POST https://open.tiktokapis.com/v2/oauth/token/ \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_key={key}&client_secret={secret}&grant_type=authorization_code&code={code}&redirect_uri=..."
   ```

### 4. 加入 GitHub Secrets
| Secret Name | Value |
|-------------|-------|
| `TIKTOK_CLIENT_KEY` | App 的 Client Key |
| `TIKTOK_CLIENT_SECRET` | App 的 Client Secret |
| `TIKTOK_REFRESH_TOKEN` | OAuth 換來的 refresh_token（365天有效） |

---

## YouTube

### 1. 建立 YouTube 頻道
1. 用 `alpha-engineer@hotmail.com` 登入 Google（或新建一個 Google 帳號）
2. 到 youtube.com → 右上角頭像 → Create a channel
3. 頻道名稱：**Alpha Engineer**
4. 上傳頻道大頭照 + Banner（沿用現有設計系統）

### 2. 建立 Google Cloud Project & 啟用 YouTube API
1. 到 https://console.cloud.google.com
2. 建立新 Project（名稱：Alpha Engineer Bot）
3. APIs & Services → Enable APIs → 搜尋「YouTube Data API v3」→ Enable
4. APIs & Services → Credentials → Create Credentials → **OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Authorized redirect URIs: `https://developers.google.com/oauthplayground`
5. 下載 client ID 和 client secret

### 3. 取得 Refresh Token（一次性操作）
1. 到 https://developers.google.com/oauthplayground
2. 右上角齒輪 → 勾選「Use your own OAuth credentials」→ 填入 Client ID 和 Secret
3. 左側 Step 1 → 搜尋 `https://www.googleapis.com/auth/youtube.upload` → Authorize APIs
4. 登入並授權（用頻道帳號）
5. Step 2 → Exchange authorization code for tokens
6. 複製 **refresh_token**（長字串，永久有效直到撤銷）

### 4. 加入 GitHub Secrets
| Secret Name | Value |
|-------------|-------|
| `YOUTUBE_CLIENT_ID` | Google Cloud OAuth Client ID |
| `YOUTUBE_CLIENT_SECRET` | Google Cloud OAuth Client Secret |
| `YOUTUBE_REFRESH_TOKEN` | OAuth Playground 取得的 refresh token |

### 內容說明
- 每週三同步從 carousel 圖片自動產生 **YouTube Shorts**（21秒以內的垂直短影音）
- 格式：每張圖顯示 3 秒 → 合成 1080×1920 短片上傳
- Shorts 演算法對新頻道友好，適合早期增粉
