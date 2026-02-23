import fetch from 'node-fetch';
global.Headers = global.Headers || (await import('node-fetch')).Headers;

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Slack送信用の共通関数
async function sendSlack(message) {
  try {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
  } catch (e) {
    console.error('Slack送信失敗:', e.message);
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
let isReportSentToday = false; // 二重送信防止フラグ

async function poll() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // --- 1. 定期リポート送信 (毎日 18:00) ---
  if (hours === 18 && minutes === 0) {
    if (!isReportSentToday) {
      console.log("⏰ 18:00になりました。本日の全項目レポートを配信します...");
      
      const dateStr = now.getFullYear() + 
                      String(now.getMonth() + 1).padStart(2, '0') + 
                      String(now.getDate()).padStart(2, '0');
      const filename = `Daily_Insight_${dateStr}.md`;
      
      if (fs.existsSync(filename)) {
        const content = fs.readFileSync(filename, 'utf-8');
        await sendSlack(`📝 【Daily Insight 定期報告】\n\n${content}`);
        console.log('✅ 定期リポート送信完了:', filename);
        isReportSentToday = true; // 送信済みマーク
      } else {
        console.log('⚠️ レポートファイルが見つかりません。バッチの実行を確認してください。');
      }
    }
  } else {
    // 18:01以降になったらフラグをリセット（翌日のために）
    if (isReportSentToday) isReportSentToday = false;
  }

  // --- 2. 自動書き換えの指示をチェック ---
  try {
    const { data: inst } = await supabase.from('system_instructions').select('*').eq('status', 'pending').limit(1).single();
    if (inst) {
      console.log('🚀 自動書き換え実行:', inst.file_path);
      fs.writeFileSync(path.join(process.cwd(), inst.file_path), inst.code_content);
      await supabase.from('system_instructions').update({ status: 'completed' }).eq('id', inst.id);
    }
  } catch (e) { /* instructionがない場合はスルー */ }

  // --- 3. 未送信の重要ログをSlackへ転送 (エラー通知等) ---
  try {
    const { data: logs } = await supabase.from('monitoring_logs').select('*').eq('is_sent', false);
    if (logs && logs.length > 0) {
      for (const log of logs) {
        await sendSlack(`📢 [System Alert]\n${log.message}`); 
        await supabase.from('monitoring_logs').update({ is_sent: true }).eq('id', log.id);
        console.log('📢 重要ログをSlackへ転送しました');
      }
    }
  } catch (e) { /* ログがない場合はスルー */ }
}

// 起動時に1回だけ実行
async function init() {
  console.log('🕵️ 自律監視エージェント(V4.2) 本番モードで稼働中...');
  await sendSlack("🚀 VPS(ABLENET)上でシステムが【本番モード】で起動しました。毎日18:00にフルレポートを報告します。");
}

init();
setInterval(poll, 10000); // 10秒おきにチェック