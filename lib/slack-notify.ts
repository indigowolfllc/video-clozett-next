/**
 * Slack通知ユーティリティ
 * SLACK_WEBHOOK_URL に Incoming Webhook URLが設定されている前提
 */
export async function notifySlack(text: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    console.error("[slack-notify] 通知送信失敗");
  }
}
