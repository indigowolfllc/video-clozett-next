import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { fetchOEmbed } from "@/lib/oembed"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
const FREE_PLAN_LIMIT = 100

export async function POST(req: NextRequest) {
  try {
    const { url, drawer_id, memo } = await req.json()
    if (!url || !drawer_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // URL上限チェック
    const { count } = await supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", TEST_USER_ID)
    if (count && count >= FREE_PLAN_LIMIT) {
      return NextResponse.json({ error: "保存上限に達しました（無料プラン：100件）" }, { status: 403 })
    }

    const oembed = await fetchOEmbed(url)
    const { data, error } = await supabase
      .from("items")
      .insert({
        url,
        drawer_id,
        user_id: TEST_USER_ID,
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const { error } = await supabase.from("items").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, memo, watched } = await req.json()
    const { data, error } = await supabase
      .from("items")
      .update({ memo, watched })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ item: data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}