# Alpha Engineer — Reel 腳本規劃

## reel_01 ✅ 已完成
- **主題**：Engineer building passive income at night
- **腳本**：Stop trading hours for dollars. This engineer uses AI to build income streams that never sleep.
- **搭配貼文**：#25（ElevenLabs）
- **檔案**：reels/reel_01_final.mp4

---

## reel_02（下一支）
- **主題**：AI stack reveal / build-in-public
- **Higgsfield Prompt**：
  ```
  A sleek home office setup at night with multiple browser tabs showing AI tools like Claude, Notion, and GitHub, cinematic overhead shot, soft blue-purple ambient lighting, minimal desk aesthetic, 4K quality
  ```
- **腳本**（8 秒）：
  ```
  This is the AI stack running a $0-budget side hustle. No team. No office. Just these tools.
  ```
- **搭配貼文**：#6（AI Stack BTS）或 #34（Automation pipeline BTS）
- **目標**：展示 Alpha Engineer 的 AI 工具組合

---

## reel_03
- **主題**：Passive income while sleeping
- **Higgsfield Prompt**：
  ```
  A smartphone on a nightstand in a dark bedroom showing a banking app with incoming deposits, while the owner sleeps peacefully in background, warm ambient lighting, cinematic close-up, ultra-realistic
  ```
- **腳本**（8 秒）：
  ```
  Engineers trade time for salary. The top 10% also build systems that earn while they sleep.
  ```
- **搭配貼文**：#30（YouTube Shorts passive income）或 #10（3 income streams）

---

## reel_04
- **主題**：Dividend investing / wealth building
- **Higgsfield Prompt**：
  ```
  Cinematic close-up of a hand scrolling through a brokerage app showing green portfolio gains, modern minimal UI, cool blue office lighting, shallow depth of field, professional atmosphere
  ```
- **腳本**（8 秒）：
  ```
  Your salary is one income stream. Dividend investing adds a second one. AI tools add a third.
  ```
- **搭配貼文**：#48（Dividend investing）或 #7（Dividends + AI）

---

## reel_05
- **主題**：Engineer typing code → income
- **Higgsfield Prompt**：
  ```
  Time-lapse style shot of code appearing on a dark terminal screen, green and cyan text glowing, hands rapidly typing, camera slowly zooming in, dramatic lighting, cinematic quality
  ```
- **腳本**（8 秒）：
  ```
  Every engineer already has the hardest skill. The question is whether you're selling it once, or building it into products.
  ```
- **搭配貼文**：#65（SaaS from code）或 #36（Notion templates）

---

## reel_06
- **主題**：Affiliate income reveal
- **Higgsfield Prompt**：
  ```
  A focused creator at a clean desk, laptop screen glowing with analytics dashboard showing commission earnings, electric blue accent lighting, cinematic medium shot, professional content creator aesthetic
  ```
- **腳本**（8 秒）：
  ```
  You're already recommending AI tools to people for free. With an affiliate link, that becomes income.
  ```
- **搭配貼文**：#56（Affiliate marketing $300/mo）

---

## 製作指南

1. 在 Higgsfield 選 **Cinema Studio 3.5**，1080p，8秒
2. 生成後下載 MP4
3. 用 ElevenLabs Roger 聲音生成 MP3（`gen_voice.py`）
4. 用 `make_reel2.py` 轉 9:16 + 模糊背景
5. 用 `burn_subs.py` 燒入字幕（先更新 `C:\Temp\reel01.srt` 內容）
6. 最終存入 `reels/` 資料夾，命名 `reel_0X_final.mp4`
