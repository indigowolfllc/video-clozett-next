import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { notifySlack } from "@/lib/slack-notify"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") || "/closet"

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)

    // ✅ 新規ユーザー判定して通知
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single()

        if (!existing) {
          // usersテーブルに存在しない = 初回ログイン = 新規ユーザー
          await notifySlack(
            `🆕 *新規ユーザー登録！*\n📧 ${user.email}\n🕐 ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`
          )
        }
      }
    } catch {
      // 通知失敗でもリダイレクトは続行
    }
  }

  return NextResponse.redirect(new URL(next, req.url))
}
