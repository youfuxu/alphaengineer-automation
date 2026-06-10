# Alpha Engineer — IG 自動發文 (GitHub Actions 版)

取代 n8n 的免費自動發文系統。每週三自動幫 `@alphaengineer.ai` 發一篇 IG 貼文（單圖或輪播）。

**狀態：已上線 ✅**（2026-06-10 第一篇 carousel 發布成功）

## 設定步驟

### 1. 加入 GitHub Secrets
到 repo → Settings → Secrets and variables → Actions → New repository secret，新增：

| Name | Value |
|---|---|
| `IG_ACCESS_TOKEN` | Instagram Graph API access token |
| `IG_USER_ID` | `36062558410056614` |

### 2. 把貼文圖片放進 assets/
每組貼文一個資料夾，圖片建議 1080x1080px，檔名用數字編號（01, 02, ...）保證輪播順序正確。

`assets/claude-api-side-hustle/` 已放好第一篇 carousel 的 6 張圖（從
`~/.claude/skills/ai-monetization-content/assets/claude-api-side-hustle-carousel.html`
用 Playwright 截圖匯出）。新貼文照同樣方式準備圖片即可。

### 3. 編輯 posts/posts.json
依照範例格式新增貼文：

```json
{
  "id": 2,
  "caption": "貼文文案 + hashtags",
  "images": ["assets/post-02/01.png", "assets/post-02/02.png"]
}
```

- `images` 只有 1 張 → 發單圖貼文
- `images` 有多張 → 自動發輪播（carousel）

### 4. 排程邏輯
`scripts/post.mjs` 會用「當週 ISO 週數 % posts.json 篇數」決定這週要發哪篇，自動輪替、不會重複設定。
每增加一篇 posts.json，輪替池子就變大，不需改程式。

排程時間：每週三 14:53 UTC（約等於 11am ET，依日光節約時間略有 ±1 小時誤差）。

### 5. 手動測試
GitHub repo → Actions → Post to Instagram → Run workflow，可以隨時手動觸發測試。

## 圖片發布注意事項
- 圖片網址用 jsdelivr CDN（`cdn.jsdelivr.net/gh/{repo}@{branch}/{path}`），**不要改回** `raw.githubusercontent.com`——Meta 的圖片抓取器對它會 timeout（error code -2 / 2207003）。
- carousel 多張圖之間，腳本會自動 sleep 2 秒再建下一張的 container。這是因為 jsdelivr 背後是 Cloudflare，太快連續請求會讓某一張回傳非圖片內容，IG 那邊會報 `error_subcode 2207052`（Only photo or video can be accepted）。
- 新圖片第一次 push 後，建議先用瀏覽器或 `curl` 對 jsdelivr 網址做一次 GET，預熱 CDN 快取。

## Token 到期提醒
Instagram access token 約 60 天到期（這組 token 約 2026-08 初到期）。到期前需要到 Meta 開發者後台重新取得 token 並更新 `IG_ACCESS_TOKEN` secret（GitHub Actions 無法自動更新 secrets）。
