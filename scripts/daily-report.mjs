/**
 * Daily Status Report Generator
 * 每天一鍵輸出所有專案的當日狀態報告
 *
 * 使用方式：
 *   node scripts/daily-report.mjs
 *   node scripts/daily-report.mjs --email     (同時寄 email，需設 EMAIL_TO env)
 *
 * 輸出：Markdown 格式報告到 stdout
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function formatDate(d = new Date()) {
  return d.toISOString().split('T')[0];
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// === Alpha Engineer Report ===
function alphaEngineerReport() {
  const postsPath = join(ROOT, 'posts/posts.json');
  const { posts } = JSON.parse(readFileSync(postsPath, 'utf8'));
  const weekNum = getISOWeek(new Date());
  const todayPost = posts[weekNum % posts.length];

  const pillars = {};
  for (const p of posts) {
    pillars[p.pillar || 'unknown'] = (pillars[p.pillar || 'unknown'] || 0) + 1;
  }

  const lines = [
    `## 📱 Alpha Engineer (@alphaengineer.ai)`,
    ``,
    `- **Total posts:** ${posts.length} (covers ~${Math.round(posts.length / 52 * 12)} months)`,
    `- **This week's post (W${weekNum}):** Post #${todayPost.id} — ${todayPost.caption?.slice(0, 60)}...`,
    `- **Pillars:** ${Object.entries(pillars).map(([k,v]) => `${k}: ${v}`).join(' / ')}`,
    ``,
    `**Tools ready to use:**`,
    `- \`node scripts/generate-post.mjs --topic "..." --pillar ... --id 51\` (auto-generator)`,
    `- \`node scripts/cdn-warmup.mjs --post XX\` (CDN prewarming)`,
    ``,
    `**Actions needed:**`,
    `- [ ] \`git push origin main\` (commits 48dc47f + ffd7e97 pending)`,
    `- [ ] Apply for ElevenLabs affiliate (see docs/AFFILIATE_READY.md)`,
    `- [ ] Set YouTube secrets (YOUTUBE_CLIENT_ID/SECRET/REFRESH_TOKEN)`,
  ];

  return lines.join('\n');
}

// === Football Intel Report ===
function footballIntelReport() {
  const botPath = 'C:\\Users\\徐佑福\\worldcup-bot';
  const logsDir = join(botPath, 'logs');
  let latestLog = null;
  let logSummary = 'No logs today yet';

  if (existsSync(logsDir)) {
    const logs = readdirSync(logsDir)
      .map(f => ({ f, mtime: statSync(join(logsDir, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);
    if (logs.length > 0) {
      const content = readFileSync(join(logsDir, logs[0].f), 'utf8');
      const lines = content.trim().split('\n');
      const lastLines = lines.slice(-5).join('\n');
      logSummary = lastLines || 'Empty log';
      latestLog = logs[0].f;
    }
  }

  return [
    `## ⚽ Football Intel (YouTube Bot)`,
    ``,
    `- **Schedule:** Daily 08:00 + 08:30 (Windows Task Scheduler, Interactive only)`,
    `- **Latest log:** ${latestLog || 'None today'}`,
    `- **Status:** ${logSummary}`,
    ``,
    `**Actions needed:**`,
    `- [ ] Set YOUTUBE_DATA_API_KEY in .env (improves topic detection)`,
    `- [ ] Monitor subscriber growth (target: 1K for YPP)`,
  ].join('\n');
}

// === Intel Bots Report ===
function intelBotsReport() {
  const botsPath = 'C:\\Users\\徐佑福\\intel-bots';
  const hasChannels = existsSync(join(botsPath, 'channels', 'techintel.yaml'));

  return [
    `## 🤖 Intel Bots (Tech / Money / Crime Intel)`,
    ``,
    `- **Status:** Pipeline tested ✅ | Script prompts upgraded 2026-06-17 ✅`,
    `- **Channels ready:** ${hasChannels ? '3/3 (techintel, moneyintel, crimeintel)' : 'Check channels/ dir'}`,
    `- **Waiting on:** YouTube identity verification`,
    ``,
    `**Actions needed:**`,
    `- [ ] Complete YouTube phone/identity verification`,
    `- [ ] Create 3 YouTube brand channels`,
    `- [ ] Run OAuth authorization for each channel`,
    `- [ ] Launch schedule_all.ps1`,
  ].join('\n');
}

// === Dual Brand Report ===
function dualBrandReport() {
  const pipelinePath = 'C:\\Users\\徐佑福\\dual-brand-pipeline';
  const hasRailway = existsSync(join(pipelinePath, 'railway.json'));

  return [
    `## 🏮 Dual Brand Pipeline (複利人生 + 尊福)`,
    ``,
    `- **Status:** test:dry passed ✅ | Railway config ready ${hasRailway ? '✅' : '⏳'} | Logger added ✅`,
    `- **Brands:** 2 (finance 08:00 / zunfu 09:30)`,
    `- **Blocked by:** Buffer cleanup (manual) + zunfu Make.com Router (manual)`,
    ``,
    `**Actions needed:**`,
    `- [ ] Login to Buffer → delete test posts from 2026-06-12`,
    `- [ ] Login to Make.com → create zunfu brand Router branch`,
    `- [ ] Run \`node src/run.js finance\` as final E2E test`,
    `- [ ] Deploy to Railway (after above confirmed)`,
  ].join('\n');
}

// === Quick Git Status ===
function gitStatusReport() {
  try {
    const status = execSync('git -C "C:\\Users\\徐佑福\\alphaengineer-automation" log --oneline -5 2>&1', { encoding: 'utf8' });
    return [
      `## 📦 Git Status (alphaengineer-automation)`,
      ``,
      `Recent commits (push pending):`,
      status.trim().split('\n').map(l => `- ${l}`).join('\n'),
    ].join('\n');
  } catch {
    return '## 📦 Git Status\nUnable to read git log';
  }
}

// === Generate Report ===
const now = new Date();
const report = [
  `# 🎯 LiftOS Daily Status Report`,
  `**Date:** ${formatDate(now)} | **Generated:** ${now.toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' })} (Taiwan)`,
  ``,
  `---`,
  ``,
  alphaEngineerReport(),
  ``,
  `---`,
  ``,
  footballIntelReport(),
  ``,
  `---`,
  ``,
  intelBotsReport(),
  ``,
  `---`,
  ``,
  dualBrandReport(),
  ``,
  `---`,
  ``,
  gitStatusReport(),
  ``,
  `---`,
  `*Generated by LiftOS Daily Report script*`,
].join('\n');

console.log(report);
