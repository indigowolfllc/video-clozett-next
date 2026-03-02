import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Slack署名検証
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
  if (!signingSecret) {
    console.error("SLACK_SIGNING_SECRET is missing");
    return new NextResponse("Server misconfigured", { status: 500 });
  }

  const timestamp = req.headers.get("x-slack-request-timestamp") || "";
  const signature = req.headers.get("x-slack-signature") || "";
  const bodyText = await req.text();

  // 署名検証
  const isValid = verifySlackSignature(bodyText, timestamp, signature, signingSecret);
  if (!isValid) {
    console.warn("Invalid Slack signature");
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const body = JSON.parse(bodyText);

  // URL Verification
  if (body.type === "url_verification") {
    return new NextResponse(body.challenge, { status: 200 });
  }

  // Event Callback
  if (body.type === "event_callback") {
    const event = body.event;

    // メッセージイベント（Botの発言は除外）
    if (event.type === "message" && !event.bot_id) {
      console.log("Slack message received:", event);

      const payload = {
        text: event.text || "",
        user: event.user,
        channel: event.channel,
        ts: event.ts,
        thread_ts: event.thread_ts || null,
        files: event.files || [],
        raw: event
      };

      console.log("Payload for AI:", payload);

      // ここでAIに渡す処理を実装（後で制作側AIが担当）
      // await sendToAI(payload);

      return new NextResponse("Message received", { status: 200 });
    }

    return new NextResponse("Event received", { status: 200 });
  }

  return new NextResponse("OK", { status: 200 });
}

// App RouterでSlackイベントを確実に受け取るための設定
export const dynamic = "force-dynamic";
