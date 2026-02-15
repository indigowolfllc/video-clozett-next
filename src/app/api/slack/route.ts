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
      // 修正：Google AI StudioのAPIキーで、最も確実に通るURL構成
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const aiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `あなたはAI秘書CloZettです。短く気さくに、日本語で返信してください：${event.text}` }]
          }]
        })
      });

      const aiData = await aiRes.json();
      
      let aiText = "";

      if (aiData.candidates && aiData.candidates[0].content) {
        aiText = aiData.candidates[0].content.parts[0].text;
      } else {
        // ここで、Google側が返してきた「本当の理由」を詳細に暴きます
        const errorMsg = aiData.error ? `${aiData.error.status}: ${aiData.error.message}` : "未知の応答形式";
        aiText = `【デバッグ報告】Google側で問題が発生：${errorMsg}`;
      }

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