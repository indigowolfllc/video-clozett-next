import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import https from 'https';

// --- [設定エリア] ---
const SUPABASE_IP = "3.36.19.124"; 
const HOST_NAME = "ybfrgywpjimbacrfplesb.supabase.co";

// --- [通信の心臓部：最強のバイパス設定] ---
const agent = new https.Agent({
    rejectUnauthorized: false, // 古いOSの証明書エラーを無視
    keepAlive: true
});

const customFetch = (url, options = {}) => {
    // ドメイン名をIPアドレスに強制置換
    const directUrl = url.replace(HOST_NAME, SUPABASE_IP);
    
    return fetch(directUrl, {
        ...options,
        agent,
        headers: {
            ...options.headers,
            "Host": HOST_NAME // サーバーが誰宛の通信か判別するために必須
        },
        timeout: 30000 // 30秒まで粘る
    });
};

// fetchをグローバルに上書き
global.fetch = customFetch;
global.Headers = fetch.Headers;

import { createClient } from '@supabase/supabase-js';

// --- [環境設定] ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Supabase初期化
const supabase = createClient(config.supabase_url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// --- [メインロジック] ---
async function patrol() {
    console.log(`🚀 [最終兵器モード] 通信開始: ${SUPABASE_IP}`);
    
    // 起動時の生存報告（Slackへの直通テスト）
    await sendSlack("🏁 **兵士、最終形態で再起動完了**\nIP直撃・証明書バイパスでパトロールを開始します。");

    setInterval(async () => {
        try {
            const { data: tasks, error } = await supabase
                .from(config.table)
                .select('*')
                .eq('status', 'pending')
                .limit(1);

            if (error) {
                console.error(`\n❌ DB接続エラー: ${error.message}`);
                return;
            }

            if (tasks && tasks.length > 0) {
                const task = tasks[0];
                console.log(`\n🎯 指示受信: ${task.file_path}`);
                
                // ファイル書き換え
                fs.writeFileSync(path.resolve(__dirname, task.file_path), task.code_content);
                
                // 完了報告
                await supabase.from(config.table).update({ status: 'completed' }).eq('id', task.id);
                
                // 成功報告
                await sendSlack(`✅ **自律反映成功**\nファイル: ${task.file_path} を作成しました。`);
            } else {
                process.stdout.write("."); // 通信成功の証
            }
        } catch (e) {
            console.error("\n⚠️ パトロール中に障害:", e.message);
        }
    }, 10000);
}

async function sendSlack(text) {
    if (!process.env.SLACK_WEBHOOK_URL) return;
    try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `[${new Date().toLocaleTimeString('ja-JP')}] ${text}` })
        });
    } catch (e) { console.error("Slack失敗:", e.message); }
}

patrol();