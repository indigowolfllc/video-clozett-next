import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { plan } = await req.json()

    const priceMap: Record<string, string> = {
      lite: process.env.STRIPE_PRICE_LITE!,
      standard: process.env.STRIPE_PRICE_STANDARD!,
      pro: process.env.STRIPE_PRICE_PRO!,
    }

    const priceId = priceMap[plan]
    if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: "https://video-clozett-next.vercel.app/closet?upgraded=true",
      cancel_url: "https://video-clozett-next.vercel.app/#pricing",
      metadata: { userId },
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}