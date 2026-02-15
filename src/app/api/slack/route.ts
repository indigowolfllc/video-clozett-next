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
      // 1. エンドポイントを v1beta に戻し、モデルを flash に固定
      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `あなたはAI秘書のCloZettです。短く気さくに日本語で返信して：${event.text}` }]
          }]
        })
      });

      const aiData = await aiRes.json();
      
      let aiText = "考えがまとまりませんでした。Vercelのログでエラーを確認してください。";

      if (aiData.candidates && aiData.candidates[0].content) {
        aiText = aiData.candidates[0].content.parts[0].text;
      } else {
        // ここでエラーの正体をログに焼き付けます
        console.log("CRITICAL_API_ERROR_DETAIL:", JSON.stringify(aiData));
        if (aiData.error) {
          aiText = `Googleエラー: ${aiData.error.message}`;
        }
      }

      // 2. Slackへ返信
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
    console.error('SERVER_FATAL_ERROR:', error);
    return NextResponse.json({ ok: true });
  }
}