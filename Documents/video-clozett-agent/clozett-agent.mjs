import fetch from 'node-fetch';
global.Headers = global.Headers || (await import('node-fetch')).Headers;
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function sendSlack(message) {
  try {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
  } catch (e) { console.error('Slack送信失敗:', e.message); }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
let isSentToday = false; 

async function poll() {
  const now = new Date();
  
  // ⏰ 18:00ちょうどに一度だけ実行するロジック
  if (now.getHours() === 18 && now.getMinutes() === 0) {
    if (!isSentToday) {
      console.log("⏰ 18:00になりました。フルスペック・レポートを送信中...");
      const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      const filename = `Daily_Insight_${dateStr}.md`;
      
      if (fs.existsSync(filename)) {
        const content = fs.readFileSync(filename, 'utf-8');
        await sendSlack(`📝 【Daily Business Report】\n\n${content}`);
        console.log('✅ Slack送信完了');
        isSentToday = true; 
      }
    }
  } else {
    // 18:01以降になったらフラグをリセットして翌日に備える
    isSentToday = false; 
  }

  // 自動書き換え指示のチェック (Supabase連携)
  try {
    const { data: inst } = await supabase.from('system_instructions').select('*').eq('status', 'pending').limit(1).single();
    if (inst) {
      console.log('🚀 コード自動書き換えを実行中:', inst.file_path);
      fs.writeFileSync(path.join(process.cwd(), inst.file_path), inst.code_content);
      await supabase.from('system_instructions').update({ status: 'completed' }).eq('id', inst.id);
    }
  } catch (e) {}
}

async function init() {
  console.log('🕵️ 自律監視エージェント V4.2 起動完了');
  console.log('   -> 毎日 18:00 に全20項目の経営リポートを自動配信します。');
  await sendSlack("🚀 システムが【18:00定刻報告モード】で正常に起動しました。");
}

init();
setInterval(poll, 10000); // 10秒ごとに時計をチェック