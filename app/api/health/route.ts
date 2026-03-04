import { NextResponse } from "next/server";

export async function GET() {
  // Supabase URL と Key の存在確認
  return NextResponse.json({
    urlExists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    keyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}