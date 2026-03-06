// push-task.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const newAgentCode = `
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const slackUrl = process.env.SLACK_WEBHOOK_URL;

async function poll() {
  const { data: inst } = await supabase.from('system_instructions').select('*').eq('status', 'pending').limit(1).single();
  if (inst) {
    console.log('🚀 自動書き換え実行:', inst.file_path);
    fs.writeFileSync(path.join(process.cwd(), inst.file_path), inst.code_content);
    await supabase.from('system_instructions').update({ status: 'completed' }).eq('id', inst.id);
  }

  const { data: logs } = await supabase.from('monitoring_logs').select('*').eq('is_sent', false);
  if (logs && logs.length > 0) {
    for (const log of logs) {
      await fetch(slackUrl, { method: 'POST', body: JSON.stringify({ text: log.message }) });
      await supabase.from('monitoring_logs').update({ is_sent: true }).eq('id', log.id);
      console.log('📢 Slackへ転送完了');
    }
  }
}
setInterval(poll, 5000);
console.log('🕵️ 自律監視・自動書き換えエージェント(V2) 稼働中...');
`;

async function run() {
  const { error } = await supabase.from('system_instructions').insert({
    file_path: 'clozett-agent.mjs',
    code_content: newAgentCode,
    status: 'pending'
  });
  if (error) console.error('❌ 失敗:', error);
  else console.log('✅ 指示を投入しました。待機中のターミナルを確認してください。');
}
run();