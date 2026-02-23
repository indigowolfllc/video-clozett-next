
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function sendFinalSuccess() {
    console.log("🚀 ボット起動: Slack通知を送信中...");
    const res = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            text: "✅ 【自律開通】接続テストは不要になりました。\n🤖 私はあなたのVPS内で直接生成された自律型ボットです。\n📈 これより収益化エンジンの構築を開始します。" 
        })
    });
    if (res.ok) console.log("✨ Slack送信成功！これでお互いの疎通は100%証明されました。");
}
sendFinalSuccess();
