import fetch from 'node-fetch';
global.Headers = global.Headers || (await import('node-fetch')).Headers;

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Slack送信用の共通関数（v16でも確実に届くPOST形式）
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
const slackUrl = process.env.SLACK_WEBHOOK_URL;

async function poll() {
  // 1. 自動書き換えの指示をチェック
  const { data: inst } = await supabase.from('system_instructions').select('*').eq('status', 'pending').limit(1).single();
  if (inst) {
    console.log('🚀 自動書き換え実行:', inst.file_path);
    fs.writeFileSync(path.join(process.cwd(), inst.file_path), inst.code_content);
    await supabase.from('system_instructions').update({ status: 'completed' }).eq('id', inst.id);
  }

  // 2. 未送信のログをSlackへ転送
  const { data: logs } = await supabase.from('monitoring_logs').select('*').eq('is_sent', false);
  if (logs && logs.length > 0) {
    for (const log of logs) {
      // 修正箇所：sendSlack関数を使うように変更
      await sendSlack(log.message); 
      await supabase.from('monitoring_logs').update({ is_sent: true }).eq('id', log.id);
      console.log('📢 Slackへ転送完了:', log.message);
    }
  }
}

// 起動時に1回だけ実行（生存確認用）
async function init() {
  console.log('🕵️ 自律監視・自動書き換えエージェント(V4.1) 稼働中...');
  await sendSlack("🏁 VPS(ABLENET)上で自律監視システムが正常に起動しました。24時間体制でサイトを見守ります。");
}

init();
setInterval(poll, 10000); // 10秒おきにチェック