"use client"
import { createClient } from "@/lib/supabaseClient"

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://clozett.app/auth/callback",
      },
    })
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 8 }}>🗄 CloZett</h1>
        <p style={{ color: "#666", marginBottom: 32 }}>URLをクローゼットに整理</p>
        <button
          onClick={handleGoogleLogin}
          style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: "12px 24px", cursor: "pointer", fontSize: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
        >
          <img src="https://www.google.com/favicon.ico" width={20} height={20} alt="Google" />
          Googleでログイン
        </button>
      </div>
    </div>
  )
}