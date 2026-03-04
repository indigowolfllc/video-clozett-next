"use client"
import { useState } from "react"

export default function ClosetPage() {
  const [url, setUrl] = useState("")
  const [memo, setMemo] = useState("")
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSave = async () => {
    if (!url) return
    setLoading(true)
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          drawer_id: "test-drawer",
          user_id: "test-user",
          memo,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setItems((prev) => [data.item, ...prev])
        setUrl("")
        setMemo("")
        setMessage("??????")
        setTimeout(() => setMessage(""), 3000)
      }
    } catch {
      setMessage("??????????")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>Video CloZett</h1>

      <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="URL?????"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #ddd", borderRadius: 4 }}
        />
        <input
          type="text"
          placeholder="??(??)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #ddd", borderRadius: 4 }}
        />
        <button
          onClick={handleSave}
          disabled={loading}
          style={{ background: "#333", color: "#fff", padding: "8px 24px", borderRadius: 4, border: "none", cursor: "pointer" }}
        >
          {loading ? "???..." : "????"}
        </button>
        {message && <p style={{ marginTop: 8, color: "green" }}>{message}</p>}
      </div>

      <div>
        {items.map((item) => (
          <div key={item.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 12, display: "flex", gap: 12 }}>
            {item.thumbnail && <img src={item.thumbnail} alt={item.title} style={{ width: 120, height: 68, objectFit: "cover", borderRadius: 4 }} />}
            <div>
              <p style={{ fontWeight: "bold", marginBottom: 4 }}>{item.title}</p>
              {item.memo && <p style={{ color: "#666", fontSize: 14 }}>{item.memo}</p>}
              <p style={{ fontSize: 12, color: "#999" }}>{item.site}</p>
              {item.is_playable
                ? <span style={{ fontSize: 12, color: "green" }}>? ???</span>
                : <a href={item.url} target="_blank" style={{ fontSize: 12, color: "#666" }}>?????</a>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}