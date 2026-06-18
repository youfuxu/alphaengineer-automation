# 新平台帳號申請與 API 串接指南
最後更新：2026-06-18

## 狀態總覽

| 平台 | 帳號 | API Secrets | 自動發文 | Token 到期 |
|------|------|------------|---------|----------|
| Instagram | ✅ @alphaengineer.ai | ✅ 已設定 | ✅ 運作中 | ⚠️ 約 2026-08-01 |
| Threads | ✅ @alphaengineer.ai | ✅ 已設定 | ✅ 運作中 | ⚠️ 約 2026-08-01 |
| TikTok | ⬜ 待申請 | ⬜ API 審核中 | 💤 審核通過後啟用 | — |
| YouTube | ⬜ 待申請 | ⬜ 待設定 | 💤 設定後立即啟用 | — |

> ⚠️ **Token 到期提醒已自動化**：`.github/workflows/token-expiry-reminder.yml` 每週一自動檢查，到期前 30 天會自動開 GitHub Issue 提醒你。

---

## Meta Token 續期（IG + Threads）

> 每 60 天需執行一次，下次到期：約 2026-08-01

### 步驟（約 5 分鐘）

1. 到 [Meta Developer Console](https://developers.facebook.com)
2. 選擇 App「AlphaEngineer Bot」→ Tools → Graph API Explorer
3. 右上角選你的 App，點 **Generate Access Token**，勾選 scopes：
   - `instagram_basic`, `instagram_content_publish`
   - `threads_basic`, `threads_content_publish`
4. 換成 Long-lived Token（有效 60 天）：
   ```bash
   curl "https://graph.facebook.com/oauth/access_token\
     ?grant_type=fb_exchange_token\
     &client_id={APP_ID}\
     &client_secret={APP_SECRET}\
     &fb_exchange_token={SHORT_TOKEN}"
   ```
5. 到 GitHub repo → **Settings → Secrets and variables → Actions**
6. 更新 `IG_ACCESS_TOKEN`（貼上新 token）
7. 更新 `THREADS_ACCESS_TOKEN`（同一個 token）
8. 更新 `SYSTEM.md` 裡的到期日為新日期
9. 關閉 GitHub Issue（若有）

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

---

## TikTok

### 1. 建立帳號
- 下載 TikTok App 或到 tiktok.com，用 `alpha-engineer@hotmail.com` 註冊
- 帳號名稱設定為 `@alphaengineer.ai`（或接近的名稱）
- 切換為「創作者帳號」（Creator Account）

### 2. 申請開發者資格
1. 到 https://developers.tiktok.com → 用 TikTok 帳號登入
2. 建立 App：名稱「Alpha Engineer Bot」，Platform：Web
3. 申請以下 Permissions：`video.publish`（發文用）
4. 同時申請 **Content Posting API** access（說明是個人帳號自動化發文）

> ⚠️ **TikTok 審核需要 3-7 天**，提交後等待 email 通知

### 3. 取得 OAuth 憑證（審核通過後）
1. App → Credentials 取得 Client Key 和 Client Secret
2. 執行 OAuth 授權流程取得 refresh token：
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
| `TIKTOK_REFRESH_TOKEN` | OAuth 換來的 refresh_token（365天有效）|

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
4. APIs & Services → OAuth Consent Screen：
   - User Type：**External**
   - 填 App name + 你的 email
   - Scopes：加 `youtube.upload`
   - ⚠️ **CRITICAL**：Test Users → 加入你的 Google email（沒加這步會出現 "Access blocked"）
5. APIs & Services → Credentials → Create Credentials → **OAuth 2.0 Client IDs**
   - Application type：**Desktop app**（不是 Web application）
   - 名稱：Alpha Engineer Bot
6. 下載 client ID 和 client secret

### 3. 取得 Refresh Token

```bash
# 安裝 CLI（一次性）
npm install -g youtube-creator-cli

# 填入你的 credentials
youtube-creator-cli setup \
  --client-id "你的 Client ID" \
  --client-secret "你的 Client Secret" \
  --non-interactive

# 開瀏覽器授權（用 YouTube 頻道帳號登入）
youtube-creator-cli auth

# 取出 refresh_token
cat ~/.youtube-creator-cli/config.json
# 複製 "refresh_token" 的值
```

> 使用 Desktop app OAuth 不需要 redirect URI，CLI 自動起 localhost server 完成授權。

### 4. 加入 GitHub Secrets
| Secret Name | Value |
|-------------|-------|
| `YOUTUBE_CLIENT_ID` | Google Cloud OAuth Client ID |
| `YOUTUBE_CLIENT_SECRET` | Google Cloud OAuth Client Secret |
| `YOUTUBE_REFRESH_TOKEN` | `config.json` 裡的 `refresh_token` 值 |

### 5. 常見錯誤排查

| 錯誤訊息 | 原因 | 解法 |
|---------|------|------|
| `Access blocked: This app's request is invalid` | OAuth Consent Screen 沒加 Test Users | 到 Google Cloud Console → OAuth Consent Screen → Test Users → 加入你的 email |
| `invalid_grant` | refresh token 失效 | 重新執行 `youtube-creator-cli auth` |
| `quotaExceeded` | YouTube API 每日 quota 用完 | 等隔天自動重置（免費帳號 10,000 units/day）|
| `uploadLimitExceeded` | 新帳號每日上傳限制 | 申請 YouTube 頻道驗證（Verify）提升上限 |

### 內容說明
- 每週三同步從 carousel 圖片自動產生 **YouTube Shorts**（21秒以內垂直短影音）
- 格式：每張圖顯示 3 秒 → 合成 1080×1920 短片上傳
- Shorts 演算法對新頻道友好，適合早期增粉
