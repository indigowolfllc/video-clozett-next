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
let isSentToday = false; // 二重送信防止

async function poll() {
  const now = new Date();
  
  // 【ここが18時設定】
  if (now.getHours() === 18 && now.getMinutes() === 0) {
    if (!isSentToday) {
      console.log("⏰ 18:00になりました。本日のレポートを送信します...");
      const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      const filename = `Daily_Insight_${dateStr}.md`;
      
      if (fs.existsSync(filename)) {
        const content = fs.readFileSync(filename, 'utf-8');
        await sendSlack(`📝 【Daily Insight】\n\n${content}`);
        isSentToday = true; 
      }
    }
  } else if (now.getHours() !== 18) {
    isSentToday = false; // 18時以外になったらリセット
  }

  // 自動書き換え指示のチェック
  const { data: inst } = await supabase.from('system_instructions').select('*').eq('status', 'pending').limit(1).single();
  if (inst) {
    fs.writeFileSync(path.join(process.cwd(), inst.file_path), inst.code_content);
    await supabase.from('system_instructions').update({ status: 'completed' }).eq('id', inst.id);
  }
}

async function init() {
  console.log('🕵️ 自律監視エージェント(V4.2) 稼働中...（18:00に自動報告します）');
  await sendSlack("🏁 システムが【18:00自動報告モード】で起動しました。");
}

init();
setInterval(poll, 10000);