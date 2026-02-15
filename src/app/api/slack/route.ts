import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. SlackからのURL確認（Challenge）への応答
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    // 2. メンション（@アプリ名）などのイベント処理（ここを後で拡張します）
    if (body.event) {
      console.log("Event received:", body.event.type);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// ブラウザで直接開いた時に「動いていること」を確認するためのGET設定
export async function GET() {
  return NextResponse.json({ 
    status: "Video CloZett API is active",
    timestamp: new Date().toISOString()
  });
}