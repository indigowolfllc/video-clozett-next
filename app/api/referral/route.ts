import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getEffectivePlan } from "@/lib/plan"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

// ランダムな6文字の招待コードを生成
function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// GET: 自分の招待コード・統計・実効プランを取得
export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ユーザー情報を取得（招待コード含む）
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("plan, referral_code, referred_by")
    .eq("id", userId)
    .single()

  let referralCode = user?.referral_code

  // 招待コードがなければ生成して保存
  if (!referralCode) {
    let code = generateCode()
    // コードの重複チェック
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabaseAdmin
        .from("users").select("id").eq("referral_code", code).single()
      if (!existing) break
      code = generateCode()
      attempts++
    }
    await supabaseAdmin.from("users").update({ referral_code: code }).eq("id", userId)
    referralCode = code
  }

  // 自分が紹介したユーザーのうち有料プランの人数を取得
  const { data: referredUsers } = await supabaseAdmin
    .from("users")
    .select("plan")
    .eq("referred_by", userId)

  const activeReferrals = (referredUsers || []).filter(
    u => u.plan && u.plan !== "free"
  ).length

  const totalReferrals = (referredUsers || []).length

  const basePlan = user?.plan || "free"
  const effectivePlan = getEffectivePlan(basePlan, activeReferrals)

  return NextResponse.json({
    referralCode,
    referralUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://clozett.app"}/invite/${referralCode}`,
    basePlan,
    effectivePlan,
    totalReferrals,
    activeReferrals, // 今も有料プランの紹介ユーザー数
  })
}

// POST: 招待コードを適用する（登録後に呼び出す）
export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: "コードが必要です" }, { status: 400 })

  // 自分がすでに誰かに紹介されていないか確認
  const { data: currentUser } = await supabaseAdmin
    .from("users").select("referred_by, referral_code").eq("id", userId).single()

  if (currentUser?.referred_by) {
    return NextResponse.json({ error: "すでに招待コードが適用されています" }, { status: 400 })
  }

  // 自分自身のコードでないか確認
  if (currentUser?.referral_code === code.toUpperCase()) {
    return NextResponse.json({ error: "自分の招待コードは使えません" }, { status: 400 })
  }

  // 招待コードからユーザーを検索
  const { data: inviter } = await supabaseAdmin
    .from("users").select("id").eq("referral_code", code.toUpperCase()).single()

  if (!inviter) {
    return NextResponse.json({ error: "招待コードが見つかりません" }, { status: 404 })
  }

  // referred_by を設定
  await supabaseAdmin.from("users").update({ referred_by: inviter.id }).eq("id", userId)

  return NextResponse.json({ success: true, message: "招待コードを適用しました！" })
}
