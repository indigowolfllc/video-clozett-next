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
      const apiKey = process.env.GEMINI_API_KEY;
      
      // ステップ1：利用可能なモデルをリストアップする
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listRes = await fetch(listUrl);
      const listData = await listRes.json();
      
      // ステップ2：リストの中から 'generateContent' が可能なモデルを1つ選ぶ
      // (通常は gemini-1.5-flash または gemini-pro が最初に見つかります)
      const targetModel = listData.models?.find((m: any) => 
        m.supportedGenerationMethods.includes("generateContent")
      )?.name || "models/gemini-pro"; // 見つからない場合のバックアップ

      // ステップ3：見つかったモデルで返信を生成する
      const url = `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${apiKey}`;
      
      const aiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `あなたはAI秘書のCloZettです。短く気さくに、必ず日本語で返信してください：${event.text}` }]
          }]
        })
      });

      const aiData = await aiRes.json();
      
      let aiText = "";

      if (aiData.candidates && aiData.candidates[0].content) {
        aiText = aiData.candidates[0].content.parts[0].text;
      } else {
        const errorMsg = aiData.error ? aiData.error.message : "利用可能モデルが見つかりませんでした";
        aiText = `【自動モデル探索結果】使用試行モデル: ${targetModel} / エラー: ${errorMsg}`;
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