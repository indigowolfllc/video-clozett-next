import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { fetchOEmbed } from "@/lib/oembed"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { url, drawer_id, user_id, memo } = await req.json()
    if (!url || !drawer_id || !user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const oembed = await fetchOEmbed(url)

    const { data, error } = await supabase
      .from("items")
      .insert({
        url,
        drawer_id,
        user_id,
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
    const { searchParams } = new URL(req.url)
    const drawer_id = searchParams.get("drawer_id")
    if (!drawer_id) {
      return NextResponse.json({ error: "drawer_id required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("drawer_id", drawer_id)
      .order("order_index")

    if (error) throw error
    return NextResponse.json({ items: data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}