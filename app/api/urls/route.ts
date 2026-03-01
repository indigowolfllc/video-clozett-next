import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

async function createClient() {
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('認証が必要です', { status: 401 })

    const { url, title } = await req.json()
    if (!url || !title) return new Response('url と title が必要です', { status: 400 })

    const { data, error } = await supabase
      .from('urls')
      .insert([{ user_id: user.id, url, title }])
      .select()

    if (error) return new Response(error.message, { status: 400 })
    return new Response(JSON.stringify(data), { status: 200 })
  } catch {
    return new Response('サーバーエラー', { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('認証が必要です', { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return new Response('id が必要です', { status: 400 })

    const { error } = await supabase
      .from('urls')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // 自分のデータしか消せない

    if (error) return new Response(error.message, { status: 400 })
    return new Response('削除成功', { status: 200 })
  } catch {
    return new Response('サーバーエラー', { status: 500 })
  }
}