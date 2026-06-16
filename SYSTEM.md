# Alpha Engineer — 完整系統文件
帳號：@alphaengineer.ai（IG + Threads）
Landing Page：alphaengineerai.com
Email：joe303262000@hotmail.com
最後更新：2026-06-17

---

## 系統總覽

```
[每週三 11am ET]
GitHub Actions 觸發
    ↓
posts/posts.json（目前 50 篇）
    ↓
scripts/post.mjs（orchestrator）
    ↓
    ├── publishers/instagram.mjs → IG 貼文
    ├── publishers/threads.mjs → Threads 貼文
    ├── publishers/youtube.mjs → YouTube Shorts（待設定 secrets）
    └── publishers/tiktok.mjs → TikTok（待 API 審核）
```

---

## 目錄結構

```
alphaengineer-automation/
├── .github/workflows/post-to-ig.yml   # GitHub Actions 自動發文
├── posts/posts.json                    # 所有貼文輪替清單（50 篇）
├── assets/                             # 所有 carousel PNG 圖片
│   ├── post-1/ ~ post-50/             # 每個資料夾 7 張 PNG
│   └── ...
├── scripts/
│   ├── post.mjs                       # 主程式 orchestrator
│   └── publishers/
│       ├── instagram.mjs              # IG API
│       ├── threads.mjs                # Threads API
│       ├── youtube.mjs                # YouTube Shorts (待啟用)
│       └── tiktok.mjs                 # TikTok (待啟用)
├── docs/
│   ├── affiliate-programs.md          # Affiliate 計畫研究
│   ├── AFFILIATE_READY.md             # 申請行動清單
│   ├── email-newsletter-sequence.md   # Email 序列草稿
│   ├── platform-setup-guide.md        # 平台設定指南
│   └── youtube-shorts-scripts.md      # Shorts 腳本 #1-5
└── SYSTEM.md                          # 本文件
```

---

## 貼文系統（posts.json）

### 格式
```json
{
  "id": 41,
  "pillar": "ai-tools",
  "caption": "英文貼文內容（Threads 限 497 字元）",
  "images": [
    "assets/post-41/01.png",
    ...
    "assets/post-41/07.png"
  ]
}
```

### 內容支柱（50 篇現況）
| 支柱 | 英文 key | 篇數 | 比例 | 目標 |
|------|----------|------|------|------|
| AI 工具 | ai-tools | 20 | 40% | ✅ |
| 被動收入 | passive-income | 15 | 30% | ✅ |
| 財富思維 | wealth-mindset | 10 | 20% | ✅ |
| 幕後 | bts | 5 | 10% | ✅ |

### 發文排程
- 觸發：每週三 11am ET（台灣時間週四凌晨 0am）
- 順序：依 id 輪替（1→2→...→50→1）
- 50 篇覆蓋 50 週（約 12 個月）

---

## 圖片製作流程

### 單次製作流程（每 2 篇約 50 分鐘）
1. 在 `~/alpha-engineer-drafts/post-XX/build/` 建立 `carousel.html`
2. 複製 `shoot.mjs` 並建立 `node_modules` junction
3. 執行：`cd build && node shoot.mjs`
4. 7 張 PNG 生成到 `post-XX/` 目錄
5. 複製到 repo：`assets/post-XX/`
6. 更新 `posts/posts.json`
7. Commit + Push

### 設計系統
```css
背景：#0D1117（主）/ #060810（body）
Accent：#00D4FF（cyan）
字型：Space Grotesk（標題）/ Inter（正文）
左邊框：6px cyan #00D4FF
格線疊加：opacity 0.30
panel 背景：#161B22
panel 邊框：#1E2A30
```

### CDN
圖片透過 jsdelivr 提供：
```
https://cdn.jsdelivr.net/gh/youfuxu/alphaengineer-automation@main/assets/post-XX/0Y.png
```
Push 後約 5-10 分鐘 CDN 緩存。可用 curl 預熱：
```bash
for i in $(seq 1 7); do curl -s "https://cdn.jsdelivr.net/gh/youfuxu/alphaengineer-automation@main/assets/post-50/0${i}.png" -o /dev/null; done
```

---

## 平台設定

### Instagram（✅ 已啟用）
```
Secrets（GitHub repo settings）:
- IG_USER_ID: Instagram Business Account ID
- IG_ACCESS_TOKEN: Meta Graph API token（約 2026-08 初到期，需續期）
```

### Threads（✅ 已啟用）
```
Secrets:
- THREADS_ACCESS_TOKEN: Meta Threads API token（約 2026-08 初到期）
- THREADS_USER_ID: Threads 帳號 ID
注意：caption 超過 497 字元自動截斷（threads.mjs 已處理）
```

### YouTube Shorts（⏳ 待設定）
```
Secrets（待設定）:
- YOUTUBE_CLIENT_ID
- YOUTUBE_CLIENT_SECRET
- YOUTUBE_REFRESH_TOKEN
設定步驟：docs/platform-setup-guide.md
```

### TikTok（⏳ 待 API 審核）
```
Secrets（待設定）:
- TIKTOK_CLIENT_KEY
- TIKTOK_CLIENT_SECRET
- TIKTOK_REFRESH_TOKEN
狀態：TikTok Photo Mode API 申請中
```

---

## Email Funnel

```
Landing Page（alphaengineerai.com）
    ↓ 訂閱表單（Mailchimp/MailerLite）
Email 序列：
  - Day 0：Top 10 AI Tools（Lead Magnet）✅ 已設定
  - Day 3：第一個 AI 副業框架（草稿在 docs/email-newsletter-sequence.md）
  - Day 7：自動化發文系統完整拆解
  - Day 14：3 個被動收入管道誠實評測
  - Day 21：本週行動清單
```

---

## Affiliate 計畫

| 工具 | 佣金 | 狀態 | 申請連結 |
|------|------|------|---------|
| ElevenLabs | 22% 經常性 | ⏳ 待申請 | elevenlabs.io/affiliates |
| Copy.ai | 45% | ⏳ 待申請 | 官網 footer |
| Synthesia | 25% 12 個月 | ⏳ 待申請 | synthesia.io/partners/affiliates |
| Jasper AI | 25-30% 經常性 | ⏳ 待申請 | 官網 footer |
| HeyGen | 35% 前 3 個月 | ⏳ 待申請 | heygen.com/affiliate-program |

詳情：docs/AFFILIATE_READY.md

---

## 常見維護工作

### Token 續期（每 60 天）
- IG_ACCESS_TOKEN：Meta Developer Console 重新生成，更新 GitHub secret
- THREADS_ACCESS_TOKEN：同上（與 IG 同一個 token）
- 提醒：2026-07-15 後開始提醒

### 新增貼文
1. 依本文件「圖片製作流程」產出 PNG
2. 在 posts.json 末尾加入新條目
3. Commit + Push

### 檢查 GitHub Actions 執行結果
到 https://github.com/youfuxu/alphaengineer-automation/actions 查看

---

## 關鍵帳號資訊

| 平台 | 帳號 | 備註 |
|------|------|------|
| Instagram | @alphaengineer.ai | Business Account |
| Threads | @alphaengineer.ai | 已連動 IG |
| GitHub | youfuxu | 存放 repo 和 Actions |
| Namecheap | - | alphaengineerai.com DNS |
| MailerLite | joe303262000@hotmail.com | Email list |
| Mailchimp | - | 舊帳號（已棄用，改 MailerLite） |
