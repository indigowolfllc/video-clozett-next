"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type ReferralInfo = {
  referralCode: string
  referralUrl: string
  basePlan: string
  effectivePlan: string
  totalReferrals: number
  activeReferrals: number
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free（無料）",
  lite: "Lite（¥100/月）",
  standard: "Standard（¥200/月）",
  pro: "Pro（¥300/月）",
}

const PLAN_COLORS: Record<string, string> = {
  free: "#888",
  lite: "#3b82f6",
  standard: "#8b5cf6",
  pro: "#f59e0b",
}

export default function MyPage() {
  const router = useRouter()
  const [info, setInfo] = useState<ReferralInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch("/api/referral")
      .then(r => r.json())
      .then(data => {
        if (data.error === "Unauthorized") { router.push("/login"); return }
        setInfo(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  const copyUrl = () => {
    if (!info) return
    navigator.clipboard.writeText(info.referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareText = info
    ? `CloZettっていうURL管理アプリ使ってみて！\n私の招待リンクから登録すると初月プランが1段階アップするよ🎁\n\n${info.referralUrl}`
    : ""

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank")
  }

  const shareLine = () => {
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`, "_blank")
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <p>読み込み中...</p>
      </div>
    )
  }

  if (!info) return null

  const isUpgraded = info.effectivePlan !== info.basePlan

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "#fff", fontFamily: "sans-serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <button onClick={() => router.push("/closet")} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 14 }}>
            ← クローゼットに戻る
          </button>
          <h1 style={{ fontSize: 20, fontWeight: "bold" }}>マイページ</h1>
        </div>

        {/* プランカード */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 8 }}>現在のプラン</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 22, fontWeight: "bold", color: PLAN_COLORS[info.effectivePlan] || "#fff" }}>
              {PLAN_LABELS[info.effectivePlan] || info.effectivePlan}
            </span>
            {isUpgraded && (
              <span style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", fontSize: 12, padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(251,191,36,0.3)" }}>
                🎉 紹介特典で格上げ中！
              </span>
            )}
          </div>
          {isUpgraded && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
              ベースプラン：{PLAN_LABELS[info.basePlan] || info.basePlan}　→　紹介者が有料プランを継続中の間、格上げが続きます
            </p>
          )}
          <button onClick={() => router.push("/pricing")} style={{ marginTop: 16, background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13 }}>
            プランを変更する
          </button>
        </div>

        {/* 紹介プログラムカード */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>🎁 フレンド招待プログラム</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
            友達が有料プランを使っている間、あなたのプランが1段階アップし続けます
          </p>

          {/* 招待URL */}
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>あなたの招待URL</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#7dd3fc", wordBreak: "break-all" }}>
              {info.referralUrl}
            </div>
            <button onClick={copyUrl} style={{ background: copied ? "#22c55e" : "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", transition: "background 0.2s" }}>
              {copied ? "コピー済み ✓" : "コピー"}
            </button>
          </div>

          {/* シェアボタン */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <button onClick={shareTwitter} style={{ flex: 1, background: "#000", border: "1px solid #333", color: "#fff", borderRadius: 8, padding: "10px 0", cursor: "pointer", fontSize: 13 }}>
              𝕏 でシェア
            </button>
            <button onClick={shareLine} style={{ flex: 1, background: "#00b900", border: "none", color: "#fff", borderRadius: 8, padding: "10px 0", cursor: "pointer", fontSize: 13 }}>
              LINE でシェア
            </button>
          </div>

          {/* 紹介状況 */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: "bold", marginBottom: 12 }}>招待状況</p>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 8px" }}>
                <p style={{ fontSize: 28, fontWeight: "bold", color: "#7dd3fc" }}>{info.totalReferrals}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>総招待数</p>
              </div>
              <div style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 8px" }}>
                <p style={{ fontSize: 28, fontWeight: "bold", color: "#22c55e" }}>{info.activeReferrals}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>有料プラン中</p>
              </div>
              <div style={{ flex: 1, textAlign: "center", background: isUpgraded ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 8px", border: isUpgraded ? "1px solid rgba(251,191,36,0.2)" : "none" }}>
                <p style={{ fontSize: 18, fontWeight: "bold", color: isUpgraded ? "#fbbf24" : "rgba(255,255,255,0.3)", marginTop: 4 }}>{isUpgraded ? "✓ 格上げ中" : "なし"}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>特典ステータス</p>
              </div>
            </div>
            {info.activeReferrals === 0 && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 12 }}>
                招待した人が有料プランに入ると特典が発動します 🚀
              </p>
            )}
          </div>
        </div>

        {/* 仕組み説明 */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: "bold", marginBottom: 12, color: "rgba(255,255,255,0.6)" }}>招待プログラムの仕組み</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["1", "あなたの招待URLを友達にシェア"],
              ["2", "友達がそのURLから登録（初月プランが1段階アップ）"],
              ["3", "友達が有料プランを継続中の間、あなたのプランも1段階アップし続ける"],
            ].map(([num, text]) => (
              <div key={num} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ background: "rgba(59,130,246,0.2)", color: "#7dd3fc", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{num}</span>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
