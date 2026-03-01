import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const { url } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400 }
      )
    }

    // 🔐 管理者クライアント（DB書き込み用）
    const supabaseAdmin = createClient(
      Deno.env.get("PROJECT_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // 👤 ユーザー取得用クライアント（リクエストのJWTを使う）
    const supabaseUser = createClient(
      Deno.env.get("PROJECT_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization")!,
          },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      )
    }

    let httpStatus: number | null = null
    let embedSuccess = false

    try {
      const res = await fetch(url, { method: "HEAD" })
      httpStatus = res.status
      embedSuccess = res.ok
    } catch {
      embedSuccess = false
    }

    const { error } = await supabaseAdmin.from("urls").insert({
      user_id: user.id,
      url,
      http_status: httpStatus,
      embed_success: embedSuccess,
    })

    if (error) {
      return new Response(
        JSON.stringify({ error }),
        { status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500 }
    )
  }
})