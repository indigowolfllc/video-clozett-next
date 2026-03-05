import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { fetchOEmbed } from "@/lib/oembed"

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

const FREE_PLAN_LIMIT = 100

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { url, drawer_id, memo } = await req.json()
    if (!url || !drawer_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { count } = await supabaseAdmin
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
    if (count && count >= FREE_PLAN_LIMIT) {
      return NextResponse.json({ error: "保存上限に達しました（無料プラン：100件）" }, { status: 403 })
    }

    const oembed = await fetchOEmbed(url)
    const { data, error } = await supabaseAdmin
      .from("items")
      .insert({
        url,
        drawer_id,
        user_id: userId,
        memo: memo || null,
        title: oembed.title,
        thumbnail: oembed.thumbnail,
        site: oembed.site,
        is_playable: oembed.isPlayable,
      })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ success: true, item: data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to save item" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const drawer_id = searchParams.get("drawer_id")
    if (!drawer_id) {
      return NextResponse.json({ error: "drawer_id required" }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from("items")
      .select("*")
      .eq("drawer_id", drawer_id)
      .eq("user_id", userId)
      .order("order_index")
    if (error) throw error
    return NextResponse.json({ items: data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const { error } = await supabaseAdmin.from("items").delete().eq("id", id).eq("user_id", userId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id, memo, watched } = await req.json()
    const { data, error } = await supabaseAdmin
      .from("items")
      .update({ memo, watched })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ item: data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}