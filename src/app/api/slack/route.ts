import { NextResponse } from 'next/server';
const { GoogleGenerativeAI } = require("@google/generative-ai");

// これがVercelの通信制限を突破するための重要な一行です
export const runtime = 'edge'; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Slackの認証確認用
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    const event = body.event;
    // ボット自身の発言には反応しないようにガード
    if (event && !event.bot_id) {
      console.log("Processing CloZett event:", event.text);

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // 生成部分：awaitを確実に使い、エラーを防ぐ書き方にしています
      const result = await model.generateContent(`あなたは「CloZett」のAI秘書です。短く親しみやすく返信して： "${event.text}"`);
      const response = await result.response;
      const aiResponse = response.text();

      // Slackへ返信を届ける
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SLACK_TOKEN}`,
        },
        body: JSON.stringify({
          channel: event.channel,
          text: aiResponse,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // ログに詳細なエラーを出すように設定
    console.error('CLOZETT SYSTEM ERROR:', error);
    return NextResponse.json({ ok: true });
  }
}