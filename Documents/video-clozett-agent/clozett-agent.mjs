import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function startAutonomousCycle() {
    console.log("🕵️ 自律パトロール開始：Geminiからの指令を24時間監視します...");

    // 起動直後に「生存報告」をSlackへ飛ばす（自発的行動のテスト）
    await sendSlack("🚀 **自律システム覚醒**\n監視ルートが正常に確立されました。これよりGeminiの指示を待機します。");

    setInterval(async () => {
        try {
            // 1. DBから指示を取得
            const { data: tasks } = await supabase.from('system_instructions')
                .select('*').eq('status', 'pending').order('created_at', { ascending: true }).limit(1);

            if (tasks && tasks.length > 0) {
                const task = tasks[0];
                console.log(`🎯 指示受信: ${task.file_path}`);
                
                // 作業開始をSlackへ報告（あなたの要望：作業の可視化）
                await sendSlack(`🛠️ **作業開始**\n指示『${task.file_path}』の適用を開始します。`);

                const targetPath = path.resolve(__dirname, task.file_path);
                if (fs.existsSync(targetPath)) fs.copyFileSync(targetPath, targetPath + '.bak');
                fs.writeFileSync(targetPath, task.code_content);

                await supabase.from('system_instructions').update({ status: 'completed' }).eq('id', task.id);
                
                await sendSlack(`✅ **作業完了**\n『${task.file_path}』を正常に更新しました。`);
            } else {
                process.stdout.write(".");
            }
        } catch (e) {
            console.error("Error:", e.message);
        }
    }, 10000);
}

async function sendSlack(text) {
    if (!process.env.SLACK_WEBHOOK_URL) return;
    try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            body: JSON.stringify({ text: `[${new Date().toLocaleTimeString()}] ${text}` })
        });
    } catch (e) { console.error("Slack Error:", e.message); }
}

startAutonomousCycle();