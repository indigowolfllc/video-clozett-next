import { NextResponse } from 'next/server';
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. 環境変数の取得（Vercelに登録した鍵を使用）
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Slackの認証（URL検証）対応
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    const event = body.event;
    // メッセージ受信かつ、ボット自身の発言でない場合
    if (event && (event.type === 'message' || event.type === 'app_mention') && !event.bot_id) {
      
      const userText = event.text;
      const channel = event.channel;

      // 2. Geminiに思考させる
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `あなたは「CloZett」の専属秘書です。以下の発言から、散歩や食事、活動の記録を読み取り、簡潔にリアクションしてください： "${userText}"`;
      
      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();

      // 3. Slackに返信する
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SLACK_TOKEN}`,
        },
        body: JSON.stringify({
          channel: channel,
          text: aiResponse,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('CloZett Error:', error);
    return NextResponse.json({ ok: true }); // Slack側のリトライを防ぐため200を返す
  }
}