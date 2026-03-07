export async function onRequestError(
  err: { message?: string; digest?: string },
  request: { url?: string; method?: string },
  _context: unknown
) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  // 4xx系（ユーザーの操作エラー）は無視、5xx系のみ通知
  if (err.digest?.startsWith("NEXT_NOT_FOUND")) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🔥 *サーバーエラー発生！*\n📍 ${request.method || "?"} ${request.url || "不明"}\n💬 ${err.message || "不明なエラー"}\n🕐 ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
      }),
    });
  } catch {
    // 通知失敗は無視
  }
}
