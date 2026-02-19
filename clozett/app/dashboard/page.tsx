'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [url, setUrl] = useState('')
  const [urls, setUrls] = useState<{id: string, url: string}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ① データ取得：IDも含めて取得
  const fetchUrls = async () => {
    const { data, error } = await supabase
      .from('urls')
      .select('id, url')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("取得失敗:", error.message)
      return
    }
    if (data) setUrls(data)
  }

  useEffect(() => { fetchUrls() }, [])

  // ② 保存：二重送信防止ロック付き
  const addUrl = async () => {
    if (!url.trim() || isSubmitting) return
    setIsSubmitting(true)

    const { error } = await supabase
      .from('urls')
      .insert([{ url }])

    if (error) {
      alert("保存失敗: " + error.message)
    } else {
      setUrl('')
      await fetchUrls()
    }
    setIsSubmitting(false)
  }

  // ③ 削除：DBから物理削除
  const deleteUrl = async (id: string) => {
    const { error } = await supabase
      .from('urls')
      .delete()
      .eq('id', id)

    if (error) {
      alert("削除失敗: " + error.message)
    } else {
      await fetchUrls()
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">あなたの引き出し（CloZett）</h1>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="動画URLを貼り付け"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 border rounded px-3 py-2 bg-white"
            disabled={isSubmitting}
          />
          <button
            onClick={addUrl}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded text-white ${isSubmitting ? 'bg-gray-400' : 'bg-black'}`}
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>

        {urls.length === 0 ? (
          <div className="text-center text-gray-500 mt-16">保存されたURLはありません。</div>
        ) : (
          <ul className="space-y-3">
            {urls.map((item) => (
              <li key={item.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 truncate flex-1 mr-4">
                  {item.url}
                </a>
                <button onClick={() => deleteUrl(item.id)} className="text-red-500 text-sm hover:font-bold">
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}