import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

dotenv.config();

// Supabase クライアント
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// エラー通知（将来的に Slack/メール連携可能）
function notifyError(message) {
  console.error('⚠ 通知:', message);
  // TODO: Slack / メール送信に差し替え
}

// Gemini 分析関数
async function analyzeUrl(url) {
  const geminiUrl = process.env.GEMINI_URL || 'http://localhost:3001/analyze';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      return await res.json();
    } catch (err) {
      console.warn(`Gemini分析 エラー (試行${attempt}): ${err.message}`);
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error(`Gemini分析 失敗：3回リトライ済み (${url})`);
}

// 分析結果保存
async function saveAnalysisResult(url, result) {
  const { data, error } = await supabase.from('analysis_results').insert([
    { url, result_json: JSON.stringify(result), analyzed_at: new Date().toISOString() }
  ]);
  if (error) {
    notifyError(`分析結果保存エラー: ${error.message}`);
  } else {
    console.log('✅ 分析結果保存成功:', url);
  }
}

// 本体フロー
async function mainFlow() {
  console.log('🚀 Video CloZett 完全自動運営フロー開始');

  // URL 一覧取得
  const { data: urlsData, error: urlsError } = await supabase.from('urls').select('url');
  if (urlsError) {
    notifyError(`URL取得失敗: ${urlsError.message}`);
    return;
  }
  const urls = urlsData.map(u => u.url);

  for (const url of urls) {
    try {
      console.log(`⏳ 分析中: ${url}`);
      const result = await analyzeUrl(url);
      await saveAnalysisResult(url, result);
    } catch (err) {
      notifyError(`フローエラー: ${err.message}`);
    }
  }

  console.log('🚀 Video CloZett 完全自動運営フロー完了');
}

// 即実行
mainFlow();