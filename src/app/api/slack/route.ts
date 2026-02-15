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
      // 1. 最新安定版 v1 と、最新識別子 gemini-1.5-flash-latest を使用
      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `あなたはAI秘書CloZettです。短く気さくに、必ず日本語で返信してください：${event.text}` }]
          }]
        })
      });

      const aiData = await aiRes.json();
      
      let aiText = "";

      if (aiData.candidates && aiData.candidates[0].content) {
        aiText = aiData.candidates[0].content.parts[0].text;
      } else {
        // 万が一の失敗時、Googleからの「生の声」をそのままSlackに投げて正体を暴きます
        aiText = `Google応答解析: ${JSON.stringify(aiData).substring(0, 100)}`;
      }

      // 2. Slackへ返答を届ける
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
    console.error('SERVER_ERROR:', error);
    return NextResponse.json({ ok: true });
  }
}