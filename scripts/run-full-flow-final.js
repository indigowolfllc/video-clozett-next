// scripts/run-full-flow-final.js
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { IncomingWebhook } from '@slack/webhook';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// --- Supabase クライアント ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Slack 通知 ---
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const slack = slackWebhookUrl ? new IncomingWebhook(slackWebhookUrl) : null;

async function sendSlack(message) {
  if (!slack) return console.warn('Slack未設定:', message);
  try {
    await slack.send({ text: message });
    console.log('Slack:', message);
  } catch (err) {
    console.error('Slack送信エラー:', err);
  }
}

// --- GEMINI 分析 ---
async function analyzeWithGemini(url) {
  const geminiUrl = process.env.GEMINI_URL;
  if (!geminiUrl || geminiUrl.includes('localhost')) {
    await sendSlack(`⚠️ GEMINI分析スキップ: ${url}`);
    return null;
  }
  try {
    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    await sendSlack(`❌ GEMINI分析エラー (${url}): ${err.message}`);
    return null;
  }
}

// --- 分析結果保存 ---
async function saveAnalysisResult(url, result) {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .insert([{ url, result_json: JSON.stringify(result), analyzed_at: new Date().toISOString() }]);
    if (error) throw error;
    await sendSlack(`✅ GEMINI分析保存成功: ${url}`);
    return data;
  } catch (err) {
    await sendSlack(`❌ 分析結果保存エラー: ${err.message}`);
    console.error(err);
  }
}

// --- 完全自動フロー ---
export async function runFullFlow(urls) {
  await sendSlack('🚀 Video CloZett 本番フロー開始');

  for (const url of urls) {
    const result = await analyzeWithGemini(url);
    if (result) await saveAnalysisResult(url, result);
    else await sendSlack(`⚠️ GEMINI分析スキップ: ${url}`);
  }

  await sendSlack('✅ Video CloZett フロー完了');
}

// --- 実行例（ユーザーが登録した URL リストをここに渡す） ---
if (import.meta.url === `file://${process.argv[1]}`) {
  const dynamicUrls = [
    'https://my-real-user-test.com',
    'https://real-user-test-001.com',
    'https://www.yahoo.co.jp/'
  ];
  runFullFlow(dynamicUrls);
}