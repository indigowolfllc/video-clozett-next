// run-full-flow.js
import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

console.log('🚀 Video CloZett 本番完全自動フロー開始');

// Supabase クライアント（Anon Key: 通常操作）
const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// Supabase クライアント（Service Role Key: 管理/復旧操作）
const adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Gemini 分析用 URL
const GEMINI_URL = process.env.GEMINI_URL || 'https://gemini.example.com/analyze';

// DB テーブル確認フロー
async function checkTables() {
  const tables = ['urls', 'subscribers', 'click_logs', 'ad_stats', 'kpi_metrics', 'reports', 'notifications', 'scheduled_tasks', 'system_logs', 'analysis_results'];
  for (const table of tables) {
    const { data, error } = await anonClient.from(table).select().limit(1);
    if (error) console.warn(`⚠ テーブル確認エラー (${table}):`, error.message);
    else console.log(`✅ ${table} 確認済`);
  }
}

// Gemini 分析実行
async function runGeminiAnalysis(url) {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      return result;
    } catch (err) {
      console.warn(`⚠ Gemini分析 エラー (試行${attempt}):`, err.message);
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, 2000));
      else return { error: err.message };
    }
  }
}

// 分析結果をDBに保存
async function saveAnalysisResult(url, result) {
  const client = result.error ? adminClient : anonClient; // エラー時は管理用クライアントで再試行
  const { data, error } = await client.from('analysis_results').insert([
    { url, result_json: JSON.stringify(result), analyzed_at: new Date().toISOString() }
  ]);
  if (error) console.error('分析結果保存エラー:', error.message);
  else console.log('分析結果保存成功:', data);
}

// メインフロー
async function runFlow() {
  await checkTables();

  const urlsToAnalyze = ['https://example.com', 'https://example.org']; // 実運用ではDBから取得
  for (const url of urlsToAnalyze) {
    const result = await runGeminiAnalysis(url);
    await saveAnalysisResult(url, result);
  }

  console.log('✅ Video CloZett 完全自動フロー終了');
}

// 自動実行
runFlow().catch(err => console.error('フロー異常終了:', err));