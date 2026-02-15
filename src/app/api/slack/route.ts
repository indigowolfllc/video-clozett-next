import { NextResponse } from 'next/server';
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Slack認証用
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    const event = body.event;
    
    // イベントが存在し、ボット自身の発言でないことを確認
    if (event && !event.bot_id) {
      console.log("Event received:", event.type, "Text:", event.text);

      // Geminiで回答生成
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `あなたは「CloZett」の専属秘書です。簡潔に親しみやすく返信してください： "${event.text}"`;
      
      const result = await model.generateContent(prompt);
      const aiResponse = await result.response.text(); // awaitを確実に入れる

      // Slackへ返信
      const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SLACK_TOKEN}`,
        },
        body: JSON.stringify({
          channel: event.channel,
          text: aiResponse,
        }),
      });

      const slackResult = await slackRes.json();
      console.log("Slack API Response:", slackResult); // Slack側のエラーもログに出す
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('CloZett Error:', error);
    return NextResponse.json({ ok: true });
  }
}