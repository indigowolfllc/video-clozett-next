import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    const event = body.event;
    // Bot自身の発言には反応しない
    if (event && !event.bot_id) {
      const apiKey = process.env.GEMINI_API_KEY;
      
      // 1. 利用可能なモデルを自動探索
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listRes = await fetch(listUrl);
      const listData = await listRes.json();
      const targetModel = listData.models?.find((m: any) => 
        m.supportedGenerationMethods.includes("generateContent")
      )?.name || "models/gemini-1.5-flash";

      // 2. 指示内容の解析（正本作成・アンカー指示の判別）
      let promptPrefix = "あなたはAI秘書CloZettです。短く気さくに日本語で返信して：";
      if (event.text.includes("正本") || event.text.includes("まとめて")) {
        promptPrefix = "あなたは記録係のCloZettです。これまでの会話の起点・終点を捉え、発想の移ろいや経緯を重視して、ChatGPTに共有するための『正本』として構造化してまとめてください：";
      }

      // 3. Geminiへのリクエスト
      const url = `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${apiKey}`;
      const aiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${promptPrefix}${event.text}` }]
          }]
        })
      });

      const aiData = await aiRes.json();
      const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "すみません、少し考えがまとまりませんでした。";

      // 4. Slackへ返信
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({
          channel: event.channel,
          text: aiText,
          thread_ts: event.thread_ts || event.ts // スレッド内ならスレッドを維持
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: true });
  }
}