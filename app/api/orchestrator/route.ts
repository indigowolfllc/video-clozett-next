// app/api/orchestrator/route.ts

import { NextRequest, NextResponse } from "next/server";

const ORCHESTRATOR_SPEC = `
あなたはAIチームの司令塔です。
Slackからの指示を解析し、
実行が必要な場合はJSON形式で出力してください。

実行形式は以下のみ：

{
  "action": "create_or_update_file",
  "path": "app/test/page.tsx",
  "content": "ファイル内容",
  "commitMessage": "コミットメッセージ"
}

通常返信の場合はテキストで返してください。
`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const slackText = body.text;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new NextResponse("OPENAI_API_KEY missing", { status: 500 });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: ORCHESTRATOR_SPEC },
        { role: "user", content: slackText },
      ],
    }),
  });

  const data = await res.json();
  const reply =
    data.choices?.[0]?.message?.content ?? "司令塔応答失敗";

  let parsed;

  try {
    parsed = JSON.parse(reply);
  } catch {
    parsed = null;
  }

  if (parsed?.action) {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/executor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    return NextResponse.json({ reply: "🚀 実行命令を受理しました。" });
  }

  return NextResponse.json({ reply });
}

export const dynamic = "force-dynamic";