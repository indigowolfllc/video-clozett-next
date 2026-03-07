import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLimits } from '@/lib/plan'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function createClient2() {
  const cookieStore = await cookies()
  return createServerClient(
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
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient2()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('認証が必要です', { status: 401 })

    const { url, title, drawer_id } = await req.json()
    if (!url || !title) return new Response('url と title が必要です', { status: 400 })

    // 入力バリデーション（サーバーサイド）
    if (url.length > 2000) return new Response('URLは2000文字以内で入力してください', { status: 400 })
    if (title.length > 100) return new Response('タイトルは100文字以内で入力してください', { status: 400 })

    // プラン取得
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single()
    const plan = userData?.plan || 'free'
    const limits = getLimits(plan)

    // 1日の保存数制限チェック（Proは無制限）
    if (limits.dailyUrls !== -1) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { count } = await supabaseAdmin
        .from('urls')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString())

      if (count !== null && count >= limits.dailyUrls) {
        return new Response(
          `1日の保存上限（${limits.dailyUrls}件）に達しました。日付が変わるとリセットされます。`,
          { status: 429 }
        )
      }
    }

    const insertData: Record<string, unknown> = { user_id: user.id, url, title }
    if (drawer_id) insertData.drawer_id = drawer_id

    const { data, error } = await supabase
      .from('urls')
      .insert([insertData])
      .select()

    if (error) return new Response(error.message, { status: 400 })
    return new Response(JSON.stringify(data), { status: 200 })
  } catch {
    return new Response('サーバーエラー', { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient2()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('認証が必要です', { status: 401 })

    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false })

    if (error) return new Response(error.message, { status: 400 })
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response('サーバーエラー', { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient2()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('認証が必要です', { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return new Response('id が必要です', { status: 400 })

    const { error } = await supabase
      .from('urls')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return new Response(error.message, { status: 400 })
    return new Response('削除成功', { status: 200 })
  } catch {
    return new Response('サーバーエラー', { status: 500 })
  }
}
```

コミットメッセージ：
```
feat: 1日のURL保存数制限追加（Free:30件/Lite:100件/Standard:500件/Pro:無制限）
