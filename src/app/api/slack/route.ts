import { NextResponse } from 'next/server';
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Slack認証
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    const event = body.event;
    if (event && !event.bot_id) {
      console.log("Processing event:", event.type, "from user:", event.user);

      // 2. Geminiで返答を作成
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `あなたは「CloZett」のAI秘書です。以下のメッセージに短く親しみやすく返信して： "${event.text}"`;
      
      const result = await model.generateContent(prompt);
      const aiResponse = await result.response.text();
      console.log("Gemini response created:", aiResponse);

      // 3. Slackへ返信
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

      const slackStatus = await slackRes.json();
      console.log("Slack Send Result:", slackStatus);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('CRITICAL ERROR:', error);
    return NextResponse.json({ ok: true });
  }
}