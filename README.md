# Alpha Engineer — IG 自動發文 (GitHub Actions 版)

取代 n8n 的免費自動發文系統。每週三自動幫 `@alphaengineer` 發一篇 IG 貼文（單圖或輪播）。

## 設定步驟

### 1. 加入 GitHub Secrets
到 repo → Settings → Secrets and variables → Actions → New repository secret，新增：

| Name | Value |
|---|---|
| `IG_ACCESS_TOKEN` | Instagram Graph API access token |
| `IG_USER_ID` | `3606255840056614` |

### 2. 把貼文圖片放進 assets/
每組貼文一個資料夾，圖片建議 1080x1080px，檔名用數字編號（01, 02, ...）保證輪播順序正確。

現有 `posts/posts.json` 裡第一篇（Claude API Side Hustle 輪播）需要的 6 張圖，要從
`~/.claude/skills/ai-monetization-content/assets/claude-api-side-hustle-carousel.html`
匯出。那個 HTML 檔案裡每個 `.card`（1080x1080）就是一張卡片，用瀏覽器打開後截圖或匯出為 PNG，
依序放到 `assets/claude-api-side-hustle/01-cover.png` ~ `06-cta.png`。

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

## Token 到期提醒
Instagram access token 約 60 天到期。到期前需要重新取得 token 並更新 `IG_ACCESS_TOKEN` secret（GitHub Actions 無法自動更新 secrets）。
