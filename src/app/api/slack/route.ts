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
      // 修正：モデル名を「gemini-1.5-flash-latest」に変更（これが現在のGoogleの正解である可能性が高いです）
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const aiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `あなたはAI秘書のCloZettです。短く気さくに日本語で返信して：${event.text}` }]
          }]
        })
      });

      const aiData = await aiRes.json();
      
      let aiText = "";

      if (aiData.candidates && aiData.candidates[0].content) {
        aiText = aiData.candidates[0].content.parts[0].text;
      } else {
        // エラー内容をより具体的にSlackへ報告
        const errorCode = aiData.error ? aiData.error.code : "不明";
        const errorMsg = aiData.error ? aiData.error.message : JSON.stringify(aiData);
        aiText = `【Google最終検証】コード:${errorCode} / メッセージ:${errorMsg}`;
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