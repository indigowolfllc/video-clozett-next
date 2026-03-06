"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabaseClient"

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const code = (params?.code as string || "").toUpperCase()
  const [status, setStatus] = useState<"loading" | "ready" | "applying" | "done" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    // ログイン状態を確認
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setStatus("ready")
      } else {
        // 未ログイン → 招待コードをsessionStorageに保存してログインへ
        sessionStorage.setItem("pendingReferralCode", code)
        setStatus("ready")
      }
    })
  }, [code])

  const handleJoin = async () => {
    setStatus("applying")
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // セッションにコードを保存してログインへ
      sessionStorage.setItem("pendingReferralCode", code)
      router.push("/login?referral=" + code)
      return
    }

    // ログイン済みなら招待コードを適用
    const res = await fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    })
    const data = await res.json()

    if (data.success) {
      setStatus("done")
      setMessage("招待コードを適用しました！初月は1段階上のプランでご利用いただけます 🎉")
      setTimeout(() => router.push("/closet"), 3000)
    } else if (data.error === "すでに招待コードが適用されています") {
      setStatus("done")
      setMessage("すでに招待コードが適用されています")
      setTimeout(() => router.push("/closet"), 2000)
    } else {
      setStatus("error")
      setMessage(data.error || "エラーが発生しました")
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 48, maxWidth: 400, width: "90%", textAlign: "center", color: "#fff" }}>
        {/* ロゴ */}
        <div style={{ fontSize: 48, marginBottom: 8 }}>🗄</div>
        <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 4 }}>CloZett</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 32 }}>タブ地獄とはおさらば。すべてのURLを、クローゼットに。</p>

        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>招待コード</p>
          <p style={{ fontSize: 28, fontWeight: "bold", letterSpacing: 4, color: "#7dd3fc" }}>{code}</p>
        </div>

        <div style={{ background: "rgba(125, 211, 252, 0.08)", borderRadius: 12, padding: 20, marginBottom: 28, textAlign: "left" }}>
          <p style={{ fontSize: 14, fontWeight: "bold", marginBottom: 12, color: "#7dd3fc" }}>🎁 この招待で受け取れる特典</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>✨ 登録後 <strong>初月1段階上のプラン</strong> で利用可能</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>✨ 紹介してくれた方も <strong>あなたが利用中の間ずっとプラン格上げ</strong></p>
        </div>

        {status === "loading" && <p style={{ color: "rgba(255,255,255,0.5)" }}>確認中...</p>}

        {(status === "ready") && (
          <button onClick={handleJoin} style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: 16, fontWeight: "bold", cursor: "pointer", width: "100%", marginBottom: 12 }}>
            招待を受け入れて登録する
          </button>
        )}

        {status === "applying" && (
          <button disabled style={{ background: "#555", color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: 16, width: "100%", marginBottom: 12 }}>
            適用中...
          </button>
        )}

        {(status === "done" || status === "error") && (
          <div style={{ padding: 16, borderRadius: 8, background: status === "done" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: status === "done" ? "#86efac" : "#fca5a5", fontSize: 14 }}>
            {message}
          </div>
        )}

        <p style={{ marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          すでにアカウントをお持ちの方はログイン後に自動で適用されます
        </p>
      </div>
    </div>
  )
}
