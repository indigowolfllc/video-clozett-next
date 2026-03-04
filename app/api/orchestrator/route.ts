export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

const SPEC = "あなたはAIチームの司令塔です。Slackからの指示を解析し、実行が必要な場合はJSON形式で出力してください。";

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
        system: SPEC,
        messages: [{ role: "user", content: text }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.content?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}

async function callGemini(text: string, apiKey: string): Promise<string | null> {
  try {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=" + apiKey;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: SPEC + "\n\n" + text }] }],
        generationConfig: { temperature: 0.2 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slackText = body.text || "";
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let reply: string | null = null;
    let usedModel = "";

    if (claudeKey) {
      reply = await callClaude(slackText, claudeKey);
      if (reply) usedModel = "Claude";
    }
    if (!reply && geminiKey) {
      reply = await callGemini(slackText, geminiKey);
      if (reply) usedModel = "Gemini";
    }
    if (!reply) {
      return NextResponse.json({ reply: "AIが応答しませんでした" });
    }

    let parsed: any = null;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {
      parsed = null;
    }

    if (parsed?.action === "create_or_update_file") {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (baseUrl) {
        await fetch(baseUrl + "/api/executor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });
      }
      return NextResponse.json({ reply: "実行命令を受理しました（" + usedModel + "）" });
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Orchestrator error:", err);
    return NextResponse.json({ reply: "内部エラー" });
  }
}

export const dynamic = "force-dynamic";