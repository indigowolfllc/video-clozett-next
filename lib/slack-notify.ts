/**
 * Slack通知ユーティリティ
 * 環境変数 SLACK_WEBHOOK_URL に Incoming Webhook URLを設定してください
 */
export async function notifySlack(text: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return; // 未設定なら何もしない

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // 通知失敗はログだけ。メイン処理を止めない
    console.error("[slack-notify] 通知送信失敗");
  }
}
