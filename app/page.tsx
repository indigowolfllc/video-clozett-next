import Link from "next/link"

export default function Home() {
  return (
    <div style={{ fontFamily: "sans-serif", color: "#1a1a1a" }}>
      {/* ナビ */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 48px", borderBottom: "1px solid #eee" }}>
        <span style={{ fontSize: 20, fontWeight: "bold" }}>🗄 Video CloZett</span>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="#pricing" style={{ color: "#666", textDecoration: "none", fontSize: 14 }}>料金</a>
          <Link href="/closet" style={{ background: "#1a1a1a", color: "#fff", padding: "8px 20px", borderRadius: 6, textDecoration: "none", fontSize: 14 }}>無料で始める</Link>
        </div>
      </nav>

      {/* ヒーロー */}
      <section style={{ textAlign: "center", padding: "80px 24px 60px" }}>
        <p style={{ fontSize: 14, color: "#888", marginBottom: 12 }}>動画保存の新しいカタチ</p>
        <h1 style={{ fontSize: 48, fontWeight: "bold", lineHeight: 1.2, marginBottom: 24 }}>
          あなたの動画を<br />クローゼットに整理
        </h1>
        <p style={{ fontSize: 18, color: "#555", marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" }}>
          YouTube・Vimeo・TikTok・Instagram。<br />
          バラバラに保存していた動画URLを、棚と引き出しで美しく整理。
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <Link href="/closet" style={{ background: "#1a1a1a", color: "#fff", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontSize: 16, fontWeight: "bold" }}>
            無料で始める →
          </Link>
          <a href="#how" style={{ background: "#f5f5f5", color: "#1a1a1a", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontSize: 16 }}>
            使い方を見る
          </a>
        </div>
      </section>

      {/* 広告 */}
      <div style={{ textAlign: "center", padding: "0 24px 40px" }}>
        <div style={{ display: "inline-block", background: "#f0f0f0", border: "1px solid #ddd", borderRadius: 8, padding: "12px 48px", color: "#999", fontSize: 12 }}>
          📢 広告スペース（728×90）
        </div>
      </div>

      {/* 特徴 */}
      <section id="how" style={{ background: "#f9f9f9", padding: "60px 24px" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: "bold", marginBottom: 48 }}>なぜVideo CloZett？</h2>
        <div style={{ display: "flex", gap: 32, maxWidth: 900, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { icon: "📦", title: "棚で大分類", desc: "ジャンル別・目的別に棚を作成。無料で3つまで使えます。" },
            { icon: "🗂", title: "引き出しで細分類", desc: "棚の中に引き出しを作って細かく整理。1棚10個まで。" },
            { icon: "▶️", title: "サムネで一覧表示", desc: "URLを貼るだけでタイトル・サムネイルを自動取得。" },
            { icon: "🌐", title: "主要サービス対応", desc: "YouTube・Vimeo・TikTok・Instagram・X（Twitter）に対応。" },
          ].map((f) => (
            <div key={f.title} style={{ background: "#fff", borderRadius: 12, padding: 24, width: 200, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 料金 */}
      <section id="pricing" style={{ padding: "60px 24px" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: "bold", marginBottom: 48 }}>シンプルな料金体系</h2>
        <div style={{ display: "flex", gap: 24, maxWidth: 900, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { name: "Free", price: "¥0", features: ["棚3つ", "引き出し10個/棚", "URL 100件", "広告あり"], highlight: false },
            { name: "Lite", price: "¥100/月", features: ["棚10つ", "引き出し30個/棚", "URL 500件", "広告あり"], highlight: false },
            { name: "Standard", price: "¥200/月", features: ["棚30つ", "引き出し100個/棚", "URL 2,000件", "広告なし"], highlight: true },
            { name: "Pro", price: "¥300/月", features: ["棚無制限", "引き出し無制限", "URL 無制限", "広告なし"], highlight: false },
          ].map((plan) => (
            <div key={plan.name} style={{
              border: plan.highlight ? "2px solid #1a1a1a" : "1px solid #eee",
              borderRadius: 12, padding: 24, width: 180, textAlign: "center",
              background: plan.highlight ? "#1a1a1a" : "#fff",
              color: plan.highlight ? "#fff" : "#1a1a1a",
            }}>
              <h3 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>{plan.name}</h3>
              <p style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>{plan.price}</p>
              {plan.features.map((f) => (
                <p key={f} style={{ fontSize: 13, marginBottom: 4, color: plan.highlight ? "#ccc" : "#666" }}>✓ {f}</p>
              ))}
              <Link href="/closet" style={{
                display: "block", marginTop: 16, padding: "8px 0",
                background: plan.highlight ? "#fff" : "#1a1a1a",
                color: plan.highlight ? "#1a1a1a" : "#fff",
                borderRadius: 6, textDecoration: "none", fontSize: 14,
              }}>
                {plan.name === "Free" ? "無料で始める" : "選択する"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#1a1a1a", color: "#fff", textAlign: "center", padding: "60px 24px" }}>
        <h2 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 16 }}>今すぐ整理を始めよう</h2>
        <p style={{ color: "#999", marginBottom: 32 }}>クレジットカード不要。無料でいつでも始められます。</p>
        <Link href="/closet" style={{ background: "#fff", color: "#1a1a1a", padding: "14px 40px", borderRadius: 8, textDecoration: "none", fontSize: 16, fontWeight: "bold" }}>
          無料で始める →
        </Link>
      </section>

      {/* フッター */}
      <footer style={{ textAlign: "center", padding: "24px", color: "#999", fontSize: 12, borderTop: "1px solid #eee" }}>
  <p style={{ marginBottom: 8 }}>© 2025 Video CloZett. All rights reserved.</p>
  <a href="/legal" style={{ color: "#999", textDecoration: "none" }}>利用規約・プライバシーポリシー</a>
</footer>
    </div>
  )
}