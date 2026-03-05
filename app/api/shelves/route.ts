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
  const { data, error } = await supabase
    .from("shelves")
    .insert({ user_id: TEST_USER_ID, name })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shelf: data })
}