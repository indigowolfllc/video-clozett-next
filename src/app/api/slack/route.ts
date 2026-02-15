import { NextResponse } from 'next/server';

export const runtime = 'edge'; // 通信を高速化し制限を回避

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Slack認証用
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    const event = body.event;
    if (event && !event.bot_id) {
      console.log("Input received:", event.text);

      // 2. Gemini APIへ直接リクエスト（ライブラリ不使用でエラー回避）
      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `あなたはAI秘書CloZettです。短く親しみやすく返信して：${event.text}` }] }]
        })
      });

      const aiData = await aiRes.json();
      
      // APIから返ってきたテキストを抽出
      const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "すみません、少し考え込んでしまいました。";

      // 3. Slackへ返信を投稿
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({
          channel: event.channel,
          text: aiText,
        }),
      });
      
      console.log("Success: Reply sent to Slack");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('CLOZETT FINAL ERROR:', error);
    return NextResponse.json({ ok: true });
  }
}