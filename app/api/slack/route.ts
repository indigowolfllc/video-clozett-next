export const runtime = 'nodejs'

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifySlackSignature(
  reqBody: string,
  timestamp: string,
  signature: string,
  signingSecret: string
): boolean {
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (Number(timestamp) < fiveMinutesAgo) return false;

  const sigBasestring = `v0:${timestamp}:${reqBody}`;
  const mySignature =
    "v0=" +
    crypto.createHmac("sha256", signingSecret).update(sigBasestring).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(mySignature, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!signingSecret || !baseUrl) {
    console.error("Environment variables missing");
    return new NextResponse("Server misconfigured", { status: 500 });
  }

  const bodyText = await req.text();
  const body = JSON.parse(bodyText);

  // ✅ 署名検証より先にURL Verificationを処理
  if (body.type === "url_verification") {
    return new NextResponse(body.challenge, { status: 200 });
  }

  // 署名検証
  const timestamp = req.headers.get("x-slack-request-timestamp") || "";
  const signature = req.headers.get("x-slack-signature") || "";

  const isValid =
    process.env.NODE_ENV === "development"
      ? true
      : verifySlackSignature(bodyText, timestamp, signature, signingSecret);

  if (!isValid) {
    console.warn("Invalid Slack signature");
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (body.type === "event_callback") {
    const event = body.event;

    if (event.type === "message" && !event.bot_id) {
      console.log("Slack message received:", event);

      const payload = {
        text: event.text || "",
        user: event.user,
        channel: event.channel,
        ts: event.ts,
        thread_ts: event.thread_ts || null,
        files: event.files || [],
      };

      try {
        // ✅ 新しいヘッダーのみ送信（Slackのヘッダーを引き継がない）
        const orchestratorRes = await fetch(
          `${baseUrl}/api/orchestrator`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Token": process.env.INTERNAL_API_TOKEN || "internal",
            },
            body: JSON.stringify(payload),
          }
        );

        const orchestratorData = await orchestratorRes.json();
        const replyText =
          orchestratorData?.reply || "司令塔から応答がありませんでした。";

        await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: event.channel,
            text: replyText,
            thread_ts: event.thread_ts || event.ts,
          }),
        });
      } catch (err) {
        console.error("Error calling orchestrator:", err);
      }

      return new NextResponse("Message processed", { status: 200 });
    }

    return new NextResponse("Event received", { status: 200 });
  }

  return new NextResponse("OK", { status: 200 });
}

export const dynamic = "force-dynamic";