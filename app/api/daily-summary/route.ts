import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { notifySlack } from "@/lib/slack-notify"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const yesterdayISO = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  try {
    const { count: totalUsers } = await supabase
      .from("users").select("*", { count: "exact", head: true })

    const { count: newUsers } = await supabase
      .from("users").select("*", { count: "exact", head: true })
      .gte("created_at", yesterdayISO)

    const { data: planData } = await supabase.from("users").select("plan")
    const planCounts = { free: 0, lite: 0, standard: 0, pro: 0 }
    planData?.forEach((u) => {
      const p = u.plan as keyof typeof planCounts
      if (p in planCounts) planCounts[p]++
    })

    const { count: newUrls } = await supabase
      .from("urls").select("*", { count: "exact", head: true })
      .gte("created_at", yesterdayISO)

    const { count: totalUrls } = await supabase
      .from("urls").select("*", { count: "exact", head: true })

    const dateStr = now.toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric",
    })

    await notifySlack(
      `📊 *CloZett 日次サマリー ${dateStr}*\n\n` +
      `👥 *ユーザー*\n` +
      `・総数: ${totalUsers ?? 0}人\n` +
      `・新規（24h）: +${newUsers ?? 0}人\n` +
      `・Free: ${planCounts.free} / Lite: ${planCounts.lite} / Standard: ${planCounts.standard} / Pro: ${planCounts.pro}\n\n` +
      `🔗 *URL保存*\n` +
      `・総数: ${totalUrls ?? 0}件\n` +
      `・新規（24h）: +${newUrls ?? 0}件`
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("daily-summary error:", err)
    await notifySlack(`⚠️ *日次サマリー取得エラー*\n🕐 ${now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
