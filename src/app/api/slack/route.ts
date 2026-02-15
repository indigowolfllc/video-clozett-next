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
      // 修正ポイント：モデル名を URL の一部としてではなく、最もシンプルなパスで試行
      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `あなたはAI秘書のCloZettです。短く気さくに日本語で返信して：${event.text}` }] }]
        })
      });

      const aiData = await aiRes.json();
      
      let aiText = "";

      if (aiData.candidates && aiData.candidates[0].content) {
        aiText = aiData.candidates[0].content.parts[0].text;
      } else {
        // もし flash がダメなら、安定版の pro を即座に試す（二段構え）
        const fallbackRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `あなたはAI秘書のCloZettです。日本語で短く：${event.text}` }] }]
          })
        });
        const fallbackData = await fallbackRes.json();
        
        if (fallbackData.candidates) {
          aiText = fallbackData.candidates[0].content.parts[0].text;
        } else {
          aiText = `Google最終エラー: ${fallbackData.error?.message || "接続失敗"}`;
        }
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
    console.error('SYSTEM_ERROR:', error);
    return NextResponse.json({ ok: true });
  }
}