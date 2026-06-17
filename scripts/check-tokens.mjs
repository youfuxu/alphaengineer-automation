import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const WARN_DAYS = 14;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;

async function pingInstagram() {
  const token = process.env.IG_ACCESS_TOKEN;
  if (!token) return null;
  const res = await fetch(`https://graph.instagram.com/v21.0/me?fields=username&access_token=${token}`);
  const data = await res.json();
  return data.error ? `${data.error.code}: ${data.error.message}` : null;
}

async function pingThreads() {
  const token = process.env.THREADS_ACCESS_TOKEN;
  if (!token) return null;
  const res = await fetch(`https://graph.threads.net/v1.0/me?fields=username&access_token=${token}`);
  const data = await res.json();
  return data.error ? `${data.error.code}: ${data.error.message}` : null;
}

async function ensureLabel() {
  await fetch(`https://api.github.com/repos/${REPO}/labels`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'token-expiry', color: 'e11d48', description: 'API token 到期提醒' }),
  });
}

async function hasOpenWarning() {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/issues?state=open&labels=token-expiry&per_page=5`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } },
  );
  const data = await res.json();
  return Array.isArray(data) && data.length > 0;
}

async function createIssue(title, body) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, labels: ['token-expiry'] }),
  });
  return res.json();
}

// ── Main ────────────────────────────────────────────────────────────────────

const config = JSON.parse(readFileSync(resolve('config/tokens.json'), 'utf8'));
const today = new Date();
today.setHours(0, 0, 0, 0);

const warnings = [];

// 1. Date-based checks
for (const [platform, info] of Object.entries(config)) {
  const expiry = new Date(info.expiry);
  const daysLeft = Math.ceil((expiry - today) / 86_400_000);
  const status = daysLeft <= 0 ? '🔴 EXPIRED' : daysLeft <= WARN_DAYS ? `🟡 ${daysLeft}d left` : '✅';
  console.log(`[${platform}] ${info.expiry}  ${status}`);
  if (daysLeft <= WARN_DAYS) warnings.push({ platform, expiry: info.expiry, daysLeft });
}

// 2. Live API pings
const igErr = await pingInstagram();
const threadsErr = await pingThreads();
if (igErr) {
  console.error(`[instagram] live ping FAILED: ${igErr}`);
  if (!warnings.find((w) => w.platform === 'instagram'))
    warnings.push({ platform: 'instagram', expiry: config.instagram.expiry, daysLeft: null, error: igErr });
}
if (threadsErr) {
  console.error(`[threads] live ping FAILED: ${threadsErr}`);
  if (!warnings.find((w) => w.platform === 'threads'))
    warnings.push({ platform: 'threads', expiry: config.threads.expiry, daysLeft: null, error: threadsErr });
}

if (warnings.length === 0) {
  console.log('✅ All tokens OK — no action needed.');
  process.exit(0);
}

// 3. Create GitHub Issue (skip if one already open)
await ensureLabel();
if (await hasOpenWarning()) {
  console.warn('⚠️  Open token-expiry issue already exists, skipping creation.');
  process.exit(1);
}

const issueTitle = `⚠️ Token 到期警告 — ${warnings.map((w) => w.platform).join(', ')}`;
const parts = warnings.map((w) => {
  const dateStr = w.expiry;
  if (w.error) {
    return `### ${w.platform} — 🔴 Live API 測試失敗\n- 錯誤：\`${w.error}\`\n- Token 可能已失效，請立即更新 Secret`;
  }
  if (w.daysLeft <= 0) {
    return `### ${w.platform} — 🔴 Token 已到期\n- 到期日：${dateStr}\n- **立即更新** \`${w.platform.toUpperCase()}_ACCESS_TOKEN\` secret`;
  }
  return `### ${w.platform} — 🟡 ${w.daysLeft} 天後到期\n- 到期日：${dateStr}\n- 請在到期前：1) 至 Meta 開發者後台取得新 token  2) 更新 GitHub Secret  3) 更新 \`config/tokens.json\` 的 \`expiry\` 為 today + 60 天`;
});

const issueBody = parts.join('\n\n') +
  `\n\n---\n> 由 check-tokens workflow 自動建立 — ${today.toISOString().split('T')[0]}`;

const issue = await createIssue(issueTitle, issueBody);
if (issue.html_url) {
  console.warn(`⚠️  Created issue #${issue.number}: ${issue.html_url}`);
} else {
  console.error('Failed to create issue:', JSON.stringify(issue));
}
process.exit(1);
