import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001"

export async function GET() {
  const { data, error } = await supabase
    .from("shelves")
    .select("*, drawers(*)")
    .eq("user_id", TEST_USER_ID)
    .order("order_index")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shelves: data })
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  const { count } = await supabase
    .from("shelves")
    .select("*", { count: "exact", head: true })
    .eq("user_id", TEST_USER_ID)
  if (count && count >= 3) {
    return NextResponse.json({ error: "棚の上限に達しました（無料プラン：3つ）" }, { status: 403 })
  }
  const { data, error } = await supabase
    .from("shelves")
    .insert({ user_id: TEST_USER_ID, name })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shelf: data })
}

export async function PATCH(req: NextRequest) {
  const { id, name } = await req.json()
  const { data, error } = await supabase
    .from("shelves")
    .update({ name })
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shelf: data })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const { error } = await supabase.from("shelves").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}