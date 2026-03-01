'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email) {
      setMessage('メールアドレスを入力してください')
      return
    }

    setLoading(true)
    setMessage('送信中...')

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setMessage('エラー: ' + error.message)
    } else {
      setMessage('ログインリンクを送信しました。メールを確認してください。')
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Video CloZett ログイン</h1>
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: 'block', marginBottom: '12px', padding: '8px', width: '300px' }}
      />
      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ padding: '8px 16px', cursor: 'pointer' }}
      >
        {loading ? '送信中...' : 'ログインリンクを送信'}
      </button>
      <p style={{ marginTop: '20px' }}>{message}</p>
    </div>
  )
}