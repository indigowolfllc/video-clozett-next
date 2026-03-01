import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    // 1. 環境変数がそもそも読み込めているかチェック
    if (!webhookUrl) {
      console.error("❌ ERROR: SLACK_WEBHOOK_URL が設定されていません。");
      return NextResponse.json({ success: false, error: "URL missing" }, { status: 500 });
    }

    // 2. Slack への送信実行
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });

    // 3. Slack 側からの生の返答を取得
    const slackStatus = response.status;
    const slackText = await response.text();

    console.log(`📡 Slack Response: ${slackStatus} - ${slackText}`);

    if (!response.ok) {
      return NextResponse.json({ success: false, slackError: slackText }, { status: slackStatus });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ API ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}