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
  
  // 18:00ちょうどに一度だけ実行するロジック [cite: 2026-02-23]
  if (now.getHours() === 18 && now.getMinutes() === 0) {
    if (!isSentToday) {
      console.log("⏰ 18:00になりました。本日のフルレポートを送信します...");
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
    isSentToday = false; // 18時以外はフラグを戻す
  }

  // 自動書き換え指示のチェック (Memory準拠) [cite: 2026-02-01]
  try {
    const { data: inst } = await supabase.from('system_instructions').select('*').eq('status', 'pending').limit(1).single();
    if (inst) {
      fs.writeFileSync(path.join(process.cwd(), inst.file_path), inst.code_content);
      await supabase.from('system_instructions').update({ status: 'completed' }).eq('id', inst.id);
    }
  } catch (e) {}
}

async function init() {
  console.log('🕵️ 自律監視エージェント(V4.2) 本番モード稼働中...');
  console.log('   -> 毎日18:00に最新のレポートを自動配信します。');
  await sendSlack("🚀 システムが【18:00自動報告モード】で起動しました。");
}

init();
setInterval(poll, 10000);