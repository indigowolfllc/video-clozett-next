export const runtime = "nodejs";

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
  try {
    const body = await req.json();
    const slackText = body.text || "";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY missing");
      return NextResponse.json({ reply: "GEMINI_API_KEY未設定" });
    }

    // 🔥 Gemini呼び出し
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${ORCHESTRATOR_SPEC}\n\nユーザーの指示：${slackText}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json({ reply: "Gemini APIエラー発生" });
    }

    const data = await res.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "司令塔応答失敗";

    console.log("Gemini reply:", reply);

    // JSONパース試行
    let parsed: any = null;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      parsed = null;
    }

    // 🚀 実行命令がある場合
    if (parsed?.action === "create_or_update_file") {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      if (!baseUrl) {
        console.error("NEXT_PUBLIC_BASE_URL missing");
        return NextResponse.json({ reply: "BASE_URL未設定" });
      }

      await fetch(`${baseUrl}/api/executor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      return NextResponse.json({ reply: "🚀 実行命令を受理しました。" });
    }

    // 🧠 通常テキスト返信
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Orchestrator fatal error:", err);
    return NextResponse.json({ reply: "司令塔内部エラー" });
  }
}

export const dynamic = "force-dynamic";