'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type UrlItem = {
  id: number
  user_id: string
  url: string
  title: string
  created_at: string
}

// 🔐 Supabase クライアントを「関数の中」で作る（ビルド時に実行されない）
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [urls, setUrls] = useState<UrlItem[]>([])
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🔐 ログインユーザー取得
  useEffect(() => {
    const supabase = getSupabase()

    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('ログインが必要です')
        return
      }

      setUserId(user.id)
      fetchUrls(user.id)
    }

    fetchUser()
  }, [])

  // 📦 URL一覧取得（RLS対応）
  const fetchUrls = async (uid: string) => {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    if (data) {
      setUrls(data)
    }
  }

  // ➕ 追加処理（title必須）
  const handleAdd = async () => {
    if (!userId) return

    setError(null)

    if (!url.trim() || !title.trim()) {
      setError('URLとタイトルを入力してください')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          url: url.trim(),
          title: title.trim(),
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }

      // 入力リセット
      setUrl('')
      setTitle('')

      // 再取得
      await fetchUrls(userId)
    } catch (err: any) {
      setError(err.message || '追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>
      <h1>Dashboard</h1>

      {/* 入力フォーム */}
      <div style={{ marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
          }}
        />

        <input
          type="text"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
          }}
        />

        <button
          onClick={handleAdd}
          disabled={loading}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#333',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {loading ? '追加中...' : '追加'}
        </button>

        {error && (
          <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>
        )}
      </div>

      {/* 一覧表示 */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {urls.map((item) => (
          <li
            key={item.id}
            style={{
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginBottom: '15px',
            }}
          >
            <strong style={{ fontSize: '16px' }}>{item.title}</strong>
            <div style={{ marginTop: '5px' }}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0070f3' }}
              >
                {item.url}
              </a>
            </div>
            <small style={{ color: '#666' }}>
              {new Date(item.created_at).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </div>
  )
}
