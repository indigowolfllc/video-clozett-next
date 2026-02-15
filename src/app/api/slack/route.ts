import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Slack認証
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    const event = body.event;
    if (event && !event.bot_id) {
      console.log("Input text:", event.text);

      // 2. Gemini API へ直接リクエスト（ライブラリ不使用）
      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `あなたはAI秘書CloZettです。短く返信して：${event.text}` }] }]
        })
      });

      const aiData = await aiRes.json();
      
      // JSONの深い階層からテキストを取り出す（失敗した場合は予備メッセージ）
      const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Geminiとの通信に少し時間がかかっているようです。もう一度話しかけてみてください！";

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
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('FINAL SYSTEM ERROR:', error);
    return NextResponse.json({ ok: true });
  }
}