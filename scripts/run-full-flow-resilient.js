// run-full-flow-resilient.js
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { IncomingWebhook } from '@slack/webhook';
import fetch from 'node-fetch';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// --- 環境変数チェック ---
const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_URL',
  'SLACK_WEBHOOK_URL'
];

const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length) {
  console.error('❌ 必須環境変数未設定:', missingEnv.join(', '));
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const slack = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

// --- Slack通知関数 ---
async function sendSlackNotification(message) {
  try {
    await slack.send({ text: message });
    console.log('✅ Slack通知送信:', message);
  } catch (err) {
    console.error('❌ Slack通知エラー:', err);
  }
}

// --- GEMINI分析関数 ---
async function analyzeWithGemini(url) {
  if (!process.env.GEMINI_URL) {
    throw new Error('GEMINI_URL 未設定');
  }

  try {
    const res = await fetch(process.env.GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json();
    return result;
  } catch (err) {
    console.error('❌ GEMINI分析エラー', url, err);
    await sendSlackNotification(`❌ GEMINI分析エラー (${url}): ${err}`);
    return null;
  }
}

// --- 分析結果保存関数 ---
async function saveAnalysisResult(url, result) {
  if (!result) return;

  const { data, error } = await supabase
    .from('analysis_results')
    .insert([{ url, result_json: JSON.stringify(result), analyzed_at: new Date().toISOString() }]);

  if (error) {
    console.error('❌ 分析結果保存エラー:', error);
  } else {
    console.log('✅ 分析結果保存成功:', url);
  }
}

// --- URLリスト取得関数（動的） ---
async function fetchUserUrls() {
  const { data, error } = await supabase.from('user_urls').select('url');
  if (error) {
    console.error('❌ URL取得エラー:', error);
    return [];
  }
  return data.map(row => row.url);
}

// --- フルフロー実行 ---
async function runFullFlow() {
  await sendSlackNotification('🚀 Video CloZett 本番フロー開始');

  const urls = await fetchUserUrls();
  for (const url of urls) {
    if (!url) continue;
    await sendSlackNotification(`⚠️ GEMINI分析開始: ${url}`);
    const result = await analyzeWithGemini(url);
    if (!result) {
      await sendSlackNotification(`⚠️ GEMINI分析スキップ: ${url}`);
      continue;
    }
    await saveAnalysisResult(url, result);
  }

  await sendSlackNotification('✅ Video CloZett フロー完了');
}

// --- スクリプト実行 ---
runFullFlow().catch(err => {
  console.error('❌ フロー実行エラー:', err);
});