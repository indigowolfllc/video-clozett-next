import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    const event = body.event;
    if (event && !event.bot_id) {
      // 1. Gemini APIへのリクエスト (構造を厳密に修正)
      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `あなたはAI秘書CloZettです。短く気さくに返信して：${event.text}` }]
          }]
        })
      });

      const aiData = await aiRes.json();
      
      // 2. 返答の抽出（より安全な書き方に変更）
      let aiText = "考えがまとまりませんでした。もう一度送ってみて！";
      if (aiData.candidates && aiData.candidates[0].content) {
        aiText = aiData.candidates[0].content.parts[0].text;
      } else {
        console.error("Gemini Error Detail:", JSON.stringify(aiData));
      }

      // 3. Slackへ返信
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
    console.error('FINAL ERROR:', error);
    return NextResponse.json({ ok: true });
  }
}