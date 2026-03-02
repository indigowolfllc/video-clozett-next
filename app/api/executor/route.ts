// app/api/executor/route.ts

import { NextRequest, NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { action, path, content, commitMessage } = body;

    if (action !== "create_or_update_file") {
      return NextResponse.json(
        { error: "Unsupported action" },
        { status: 400 }
      );
    }

    const {
      GITHUB_TOKEN,
      GITHUB_OWNER,
      GITHUB_REPO,
      GITHUB_BRANCH,
      SLACK_BOT_TOKEN,
      SLACK_DEFAULT_CHANNEL,
    } = process.env;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !GITHUB_BRANCH) {
      return new NextResponse("GitHub env missing", { status: 500 });
    }

    // ① 既存ファイルのsha取得
    const fileRes = await fetch(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    let sha: string | undefined;

    if (fileRes.ok) {
      const fileData = await fileRes.json();
      sha = fileData.sha;
    }

    // ② ファイル作成 or 更新
    const updateRes = await fetch(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          message: commitMessage || "AI auto update",
          content: Buffer.from(content).toString("base64"),
          branch: GITHUB_BRANCH,
          sha,
        }),
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error("GitHub error:", errText);
      return NextResponse.json(
        { error: "GitHub update failed" },
        { status: 500 }
      );
    }

    // ③ Slack通知
    if (SLACK_BOT_TOKEN && SLACK_DEFAULT_CHANNEL) {
      await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: SLACK_DEFAULT_CHANNEL,
          text: `✅ GitHub commit成功\n📁 ${path}\n🌿 ${GITHUB_BRANCH}`,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Executor crashed" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";