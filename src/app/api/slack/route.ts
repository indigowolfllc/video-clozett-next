import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Slackからのリクエストは JSON または URL-encoded
    const contentType = req.headers.get('content-type');
    let body: any;

    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      body = JSON.parse(formData.get('payload') as string);
    } else {
      body = await req.json();
    }

    // 1. URL検証用
    if (body.type === 'url_verification') return NextResponse.json({ challenge: body.challenge });

    // 2. ショートカット（ボタン）操作の判定
    if (body.type === 'shortcut') {
      const action = body.callback_id;
      const channelId = body.channel?.id || body.container?.channel_id;
      
      let promptText = "";
      let feedbackText = "";

      if (action === 'clozett_start') {
        feedbackText = "【起点】記録を開始しました。ここからの発想を追いかけますね。";
        promptText = "「ここを起点に記録を開始する」という旨の挨拶を短くしてください。";
      } else if (action === 'clozett_canon') {
        feedbackText = "【正本作成】これまでの会話の移ろいを整理し、正本としてまとめます。少々お待ちください...";
        promptText = "これまでの会話の起点・終点を捉え、発想の経緯と結論を『正本（Canon）』として構造化してまとめてください。";
      }

      if (promptText) {
        const aiResponse = await getGeminiResponse(promptText);
        await sendToSlack(channelId, `*${feedbackText}*\n\n${aiResponse}`);
      }
      return NextResponse.json({ ok: true });
    }

    // 3. 通常のメッセージ（event）の処理
    const event = body.event;
    if (event && !event.bot_id && event.text) {
      // 「！」一文字でも正本作成として扱う
      const isCanonReq = event.text === "!" || event.text.includes("正本");
      const prompt = isCanonReq 
        ? "これまでの会話ログを解析し、発想の変化を含めた『正本』を作成してください。"
        : event.text;

      const aiResponse = await getGeminiResponse(prompt);
      await sendToSlack(event.channel, aiResponse, event.thread_ts || event.ts);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ ok: true });
  }
}

// Geminiへのリクエスト関数
async function getGeminiResponse(userText: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const listRes = await fetch(listUrl);
  const listData = await listRes.json();
  const targetModel = listData.models?.find((m: any) => m.supportedGenerationMethods.includes("generateContent"))?.name || "models/gemini-1.5-flash";
  
  const url = `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: userText }] }] })
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "すみません、少し考え込んでしまいました。";
}

// Slackへの返信関数
async function sendToSlack(channel: string, text: string, thread_ts?: string) {
  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}` },
    body: JSON.stringify({ channel, text, thread_ts })
  });
}