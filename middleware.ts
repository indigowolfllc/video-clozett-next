import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Rate Limiter
const rateLimitMap = new Map()
const RATE_LIMIT = 60
const RATE_WINDOW = 60_000

function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const record = rateLimitMap.get(ip)
    if (!record || now > record.resetTime) {
          rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
          return false
    }
    if (record.count >= RATE_LIMIT) return true
    record.count++
    return false
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

  // API Rate Limiting: 1分間に60リクエストまで
  if (pathname.startsWith("/api/")) {
        const ip =
                request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
                request.headers.get("x-real-ip") ??
                "unknown"
        if (isRateLimited(ip)) {
                return NextResponse.json(
                  { error: "Too many requests. Please try again in a minute." },
                  { status: 429, headers: { "Retry-After": "60" } }
                        )
        }
  }

  // Supabase Auth
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
    import { createServerClient } from "@supabase/ssr"
  import { NextResponse, type NextRequest } from "next/server"

// Rate Limiter
const rateLimitMap = new Map()
  const RATE_LIMIT = 60
  const RATE_WINDOW = 60_000

function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const record = rateLimitMap.get(ip)
    if (!record || now > record.resetTime) {
          rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
          return false
    }
    if (record.count >= RATE_LIMIT) return true
    record.count++
    return false
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // API Rate Limiting: 1分間に60リクエストまで
    if (pathname.startsWith("/api/")) {
          const ip =
                  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
                  request.headers.get("x-real-ip") ??
                  "unknown"
          if (isRateLimited(ip)) {
                  return NextResponse.json(
                    { error: "Too many requests. Please try again in a minute." },
                    { status: 429, headers: { "Retry-After": "60" } }
                          )
          }
    }

    // Supabase Auth
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
              cookies: {
                        getAll() { return request.cookies.getAll() },
                        
