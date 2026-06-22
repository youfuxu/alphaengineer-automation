# Alpha Engineer — Reel 發布時間表

> 建立日期：2026-06-23
> 所有 Reel 01-15 均已生成（.mp4 完成），可直接上傳 IG

## 上傳方式

1. **手動（最快）**：打開手機 IG App → 選 `reels/reel_XX_final.mp4` → 貼上 caption 發布
2. **GitHub Actions**：GitHub → Actions → "Upload Reel to Instagram" → Run workflow → reel_number: XX

## 品質說明

| Reel | 品質 | 來源 | 備註 |
|------|------|------|------|
| 01-06 | ⭐⭐⭐ 高 | Higgsfield Cinema | 最佳質感 |
| 07-15 | ⭐⭐ 標準 | Pexels + edge-tts | 7/18 後可用 Higgsfield 重跑升級 |

> ⚠️ Reel 09 檔案較小（441KB），上傳前建議先本機播放確認長度

---

## 發布排程（3 支 / 週，週一/三/五）

### Week 1（2026-06-23 ~ 2026-06-27）

| 日期 | 星期 | Reel | 主題 | Affiliate |
|------|------|------|------|-----------|
| **06-23** | 一 | Reel 01 | Engineers trade time for salary | ElevenLabs |
| **06-25** | 三 | Reel 02 | AI stack reveal / build-in-public | — |
| **06-27** | 五 | Reel 03 | Passive income while sleeping | ElevenLabs |

### Week 2（2026-06-30 ~ 2026-07-04）

| 日期 | 星期 | Reel | 主題 | Affiliate |
|------|------|------|------|-----------|
| **06-30** | 一 | Reel 04 | Dividend investing / wealth building | — |
| **07-02** | 三 | Reel 05 | Engineer typing code → income | — |
| **07-04** | 五 | Reel 06 | Affiliate income reveal | ElevenLabs |

### Week 3（2026-07-07 ~ 2026-07-11）

| 日期 | 星期 | Reel | 主題 | Affiliate |
|------|------|------|------|-----------|
| **07-07** | 一 | Reel 07 | One prompt generates a week of content | Synthesia |
| **07-09** | 三 | Reel 08 | The compound math engineers ignore | — |
| **07-11** | 五 | Reel 09 | Stop recommending AI tools for free | ElevenLabs |

### Week 4（2026-07-14 ~ 2026-07-18）🔔 7/18 Higgsfield Credits 重置

| 日期 | 星期 | Reel | 主題 | Affiliate |
|------|------|------|------|-----------|
| **07-14** | 一 | Reel 10 | What engineers have wrong about side income | — |
| **07-16** | 三 | Reel 11 | Your salary has a ceiling | — |
| **07-18** | 五 | Reel 12 | The $0 to $1 milestone | ElevenLabs |

> 💡 7/18 Credits 重置後：依序跑 `python scripts/make_reel.py --reel 07` 到 15，用 Higgsfield 升級品質

### Week 5（2026-07-21 ~ 2026-07-25）

| 日期 | 星期 | Reel | 主題 | Affiliate |
|------|------|------|------|-----------|
| **07-21** | 一 | Reel 13 | Financial statements vs salary decisions | — |
| **07-23** | 三 | Reel 14 | Side hustle without leaving your desk | Synthesia |
| **07-25** | 五 | Reel 15 | Engineer's unfair advantage in content | — |

---

## Caption 來源

所有 caption 存於：`reels/reel_config.json` → 每個 reel 的 `"caption"` 欄位

## 下一步（7/18 後）

1. `python scripts/make_reel.py --reel 07` → 確認安全門（需 > 90 credits）
2. 依序跑 reel_08 → reel_15
3. 考慮新 reel 16-20 的腳本規劃
