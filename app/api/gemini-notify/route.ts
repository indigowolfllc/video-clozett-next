import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { report } = await request.json();
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) return NextResponse.json({ error: "No Webhook" }, { status: 500 });

    // Gemini API からの報告内容を Slack へ転送
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: "🤖 【Gemini API 自律報告】\n" + report
      }),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}