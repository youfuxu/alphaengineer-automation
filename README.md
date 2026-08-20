# Alpha Engineer — 多平台自動發文 (GitHub Actions 版)

免費多平台自動發文系統。每週三同步發佈到所有已設定的平台；目前的安全教育內容會導向 [MindDividend Shield 全球詐騙訊息檢查器](https://alphaengineerai.com/global-online-scam-checker.html)。

這個公開專案同時示範如何用 GitHub Actions 維護可追蹤的內容佇列，讓線上安全資訊能跨語言、跨平台持續發布。

## 目前全球安全內容

下一批內容已排入佇列，並附上可直接開啟的公開入口：

- 心理施壓與可疑訊息：[Is this text a scam?](https://alphaengineerai.com/is-this-text-a-scam.html)
- 驗證碼與帳號安全：[Global online scam checker](https://alphaengineerai.com/global-online-scam-checker.html)
- 點擊後復原：[Recovery checklist](https://alphaengineerai.com/what-to-do-if-you-clicked-a-scam-link.html)
- 求職詐騙：[Online job scam checker](https://alphaengineerai.com/online-job-scam-checker.html)

這些頁面提供免費第一輪檢查與 13 種語言的安全指南；使用前請移除密碼、驗證碼、付款資料、身分文件與私人地址。

2026-08-31 前啟用短期安全優先輪播，讓最新的全球安全內容先被發布；期限後自動回到完整內容輪替。

已實際公開的 Instagram 安全內容：

- #121 [點擊或付款前先停下來](https://www.instagram.com/minddividend/p/DcQBgqpgdWq/)
- #123 [點擊可疑連結後的復原步驟](https://www.instagram.com/minddividend/p/DcQDJCHAV7g/)

| 平台 | 狀態 |
|------|------|
| Instagram | ✅ 已有兩篇公開；API 排程仍需有效的 Graph API 權杖 |
| Threads | ⚠️ 內容佇列就緒；需有效的 Threads API 權杖 |
| TikTok | 💤 申請 API 審核通過後啟用 |
| YouTube | 💤 設定 3 個 secrets 後啟用（Shorts 格式） |

**參閱 `docs/platform-setup-guide.md` 完成帳號申請與 API 設定。**

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
- 若某篇已在單一平台手動發布，可在該貼文加入 `publishedPlatforms` 與 `publishedUrls`；排程會跳過該平台，但仍保留其他平台的發布機會。

### 4. 排程邏輯
`scripts/post.mjs` 會先使用有效期限內的 `priority: "high"` 內容輪播（目前至 2026-08-31），再回到「當週 ISO 週數 % posts.json 篇數」的完整內容輪替。若貼文已在某一平台公開，排程會只跳過該平台，保留其他平台的發布機會。
每增加一篇 posts.json，完整輪替池子就變大，不需改程式。

排程時間：每週三 14:53 UTC（約等於 11am ET，依日光節約時間略有 ±1 小時誤差）。

### 5. 手動測試
GitHub repo → Actions → Post to Instagram → Run workflow，可以隨時手動觸發測試。

## 圖片發布注意事項
- 圖片網址用 jsdelivr CDN（`cdn.jsdelivr.net/gh/{repo}@{branch}/{path}`），**不要改回** `raw.githubusercontent.com`——Meta 的圖片抓取器對它會 timeout（error code -2 / 2207003）。
- carousel 多張圖之間，腳本會自動 sleep 2 秒再建下一張的 container。這是因為 jsdelivr 背後是 Cloudflare，太快連續請求會讓某一張回傳非圖片內容，IG 那邊會報 `error_subcode 2207052`（Only photo or video can be accepted）。
- 新圖片第一次 push 後，建議先用瀏覽器或 `curl` 對 jsdelivr 網址做一次 GET，預熱 CDN 快取。

## Token 到期提醒
Instagram 與 Threads 的 access token 會到期；如果工作流程出現 OAuth expired，必須到官方開發者後台重新取得權杖並更新 GitHub Actions secrets。GitHub Actions 無法在沒有使用者重新授權的情況下自動更新 secrets。
