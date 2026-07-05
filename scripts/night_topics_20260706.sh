#!/bin/bash
# 夜班批次：posts.json 101-120（支柱比例 8 ai-tools / 6 passive-income / 4 wealth-mindset / 2 bts）
cd "$(dirname "$0")/.."
set -e
gen() { node scripts/generate-post.mjs --id "$1" --pillar "$2" --topic "$3" || echo "FAILED id=$1"; }

gen 101 ai-tools "Claude Code: the terminal AI agent that ships entire features while you review"
gen 102 passive-income "Sell a spreadsheet. Financial templates quietly make engineers 1K+ per month on Gumroad"
gen 103 ai-tools "Whisper plus AI summaries: turn every meeting into searchable notes for free"
gen 104 wealth-mindset "Lifestyle creep is the silent killer of engineer wealth. Here is the math"
gen 105 passive-income "License your side project code with a commercial tier: passive income from work you already did"
gen 106 ai-tools "v0 by Vercel turns one prompt into production-ready UI"
gen 107 bts "What a week of running this account actually looks like, hour by hour"
gen 108 wealth-mindset "Your emergency fund is not an investment. Stop optimizing it"
gen 109 passive-income "Chrome extensions: the most underrated digital product for engineers"
gen 110 ai-tools "Perplexity Pages: publish SEO content straight from your research in minutes"
gen 111 passive-income "Paid newsletter vs free newsletter with sponsors: the real math"
gen 112 ai-tools "Sora vs Kling vs Higgsfield: AI video tools for creators compared honestly"
gen 113 wealth-mindset "Time-billionaire thinking: engineers retire on hours, not dollars"
gen 114 ai-tools "AI agents that monitor prices, job boards and deals for you 24/7"
gen 115 passive-income "Udemy vs hosting your own course: where engineers actually earn more"
gen 116 bts "Every tool in this account's stack and what it costs to run: almost zero"
gen 117 ai-tools "RAG explained for side hustlers: make AI answer from your own data"
gen 118 wealth-mindset "The engineer's barbell strategy: boring index funds plus aggressive skill bets"
gen 119 passive-income "API as a product: charge per call for code you wrote once"
gen 120 ai-tools "ElevenLabs voice cloning: one hour of setup, unlimited narration for your content"

echo "ALL DONE"
