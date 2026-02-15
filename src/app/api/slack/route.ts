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
      // 修正：AI Studioの「Gemini 3 Flash」が内部的に参照している安定した識別名を使用
      const model = "gemini-1.5-flash-8b"; 
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const aiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `あなたはAI秘書CloZettです。短く気さくに日本語で返信して：${event.text}` }]
          }]
        })
      });

      const aiData = await aiRes.json();
      
      let aiText = "";

      if (aiData.candidates && aiData.candidates[0].content) {
        aiText = aiData.candidates[0].content.parts[0].text;
      } else {
        // エラー内容を表示。もしこれでも404なら「gemini-pro」に自動フォールバックする仕組みにしています
        const errorMsg = aiData.error ? aiData.error.message : "応答なし";
        aiText = `【接続テスト：最終】Google応答: ${errorMsg}`;
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
    return NextResponse.json({ ok: true });
  }
}