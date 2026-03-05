import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const shelf_id = searchParams.get("shelf_id")
  if (!shelf_id) return NextResponse.json({ error: "shelf_id required" }, { status: 400 })

  const { data, error } = await supabase
    .from("drawers")
    .select("*")
    .eq("shelf_id", shelf_id)
    .order("order_index")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ drawers: data })
}

export async function POST(req: NextRequest) {
  const { name, shelf_id } = await req.json()

  // 引き出し上限チェック（無料=10個）
  const { count } = await supabase
    .from("drawers")
    .select("*", { count: "exact", head: true })
    .eq("shelf_id", shelf_id)

  if (count && count >= 10) {
    return NextResponse.json({ error: "引き出しの上限に達しました（無料プラン：10個）" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("drawers")
    .insert({ shelf_id, name })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ drawer: data })
}

export async function PATCH(req: NextRequest) {
  const { id, name } = await req.json()
  const { data, error } = await supabase
    .from("drawers")
    .update({ name })
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ drawer: data })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const { error } = await supabase.from("drawers").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}