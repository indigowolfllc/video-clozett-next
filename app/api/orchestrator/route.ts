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

async function callClaude(text: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: ORCHESTRATOR_SPEC,
        messages: [{ role: "user", content: text }],
      }),
    });
    if (!res.ok) { console.warn("Claude failed:", await res.text()); return null; }
    const data = await res.json();
    return data?.content?.[0]?.text?.trim() || null;
  } catch (err) { console.warn("Claude exception:", err); return null; }
}

async function callGemini(text: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${ORCHESTRATOR_SPEC}\n\nユーザーの指示：${text}` }] }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    );
    if (!res.ok) { console.warn("Gemini failed:", await res.text()); return null; }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) { console.warn("Gemini exception:", err); return null; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slackText = body.text || "";
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!claudeKey && !geminiKey) {
      return NextResponse.json({ reply: "AIのAPIキーが未設定です" });
    }

    let reply: string | null = null;
    let usedModel = "";

    if (claudeKey) {
      console.log("Trying Claude...");
      reply = await callClaude(slackText, claudeKey);
      if (reply) usedModel = "Claude";
    }

    if (!reply && geminiKey) {
      console.log("Trying Gemini...");
      reply = await callGemini(slackText, geminiKey);
      if (reply) usedModel = "Gemini";
    }

    if (!reply) {
      return NextResponse.json({ reply: "すべてのAI APIが応答しませんでした" });
    }

    let parsed: any = null;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch { parsed = null; }

    if (parsed?.action === "create_or_update_file") {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) return NextResponse.json({ reply: "BASE_URL未設定" });
      await fetch(`${baseUrl}/api/executor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      return NextResponse.json({ reply: `実行命令を受理しました（${usedModel}）` });
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Orchestrator fatal error:", err);
    return NextResponse.json({ reply: "司令塔内部エラー" });
  }
}

export const dynamic = "force-dynamic";