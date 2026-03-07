import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { notifySlack } from "@/lib/slack-notify"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (e) {
    console.error("Webhook signature failed:", e)
    // 🚨 署名検証失敗 = 不正なリクエストの可能性
    await notifySlack(
      `🚨 *Stripe Webhook署名検証失敗！*\n不正なリクエストの可能性があります。\n🕐 ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`
    )
    return new NextResponse("Invalid signature", { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const subscriptionId = session.subscription as string

    if (userId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const priceId = subscription.items.data[0].price.id

      const planMap: Record<string, string> = {
        [process.env.STRIPE_PRICE_LITE!]: "lite",
        [process.env.STRIPE_PRICE_STANDARD!]: "standard",
        [process.env.STRIPE_PRICE_PRO!]: "pro",
      }
      const plan = planMap[priceId] || "free"

      await supabaseAdmin
        .from("users")
        .update({ plan, stripe_subscription_id: subscriptionId })
        .eq("id", userId)

      // 💰 課金成功通知
      const planEmoji: Record<string, string> = {
        lite: "🥉", standard: "🥈", pro: "🥇"
      }
      await notifySlack(
        `💰 *課金成功！*\n${planEmoji[plan] || "💳"} プラン: ${plan.toUpperCase()}\n👤 ユーザーID: ${userId}\n🕐 ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`
      )
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId

    if (userId) {
      await supabaseAdmin
        .from("users")
        .update({ plan: "free", stripe_subscription_id: null })
        .eq("id", userId)

      // 😢 解約通知
      await notifySlack(
        `😢 *サブスクリプション解約*\n👤 ユーザーID: ${userId}\nFreeプランに戻りました\n🕐 ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`
      )
    }
  }

  return NextResponse.json({ received: true })
}
