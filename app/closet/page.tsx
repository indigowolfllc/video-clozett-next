"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabaseClient"
import { getLimits } from "@/lib/plan"

type Drawer = { id: string; name: string; shelf_id: string }
type Shelf = { id: string; name: string; drawers: Drawer[] }
type Item = { id: string; url: string; title: string; thumbnail: string; site: string; is_playable: boolean; memo: string }

// 広告スロット（モック。AdSense審査通過後に本物に差し替え）
function AdBanner({ size = "full" }: { size?: "full" | "reduced" | "minimal" }) {
  const h = size === "minimal" ? 40 : size === "reduced" ? 60 : 90
  const opacity = size === "minimal" ? 0.5 : size === "reduced" ? 0.75 : 1
  return (
    <div style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 6, height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 11, opacity, marginBottom: 12, overflow: "hidden" }}>
      広告
    </div>
  )
}

// 保存完了ポップアップ（広告付き）
function SaveSuccessModal({ onClose, adSize }: { onClose: () => void; adSize: "full" | "reduced" | "minimal" }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
        <p style={{ fontWeight: "bold", fontSize: 16, marginBottom: 4 }}>保存しました！</p>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>URLをクローゼットに追加しました</p>
        <AdBanner size={adSize} />
        <button onClick={onClose} style={{ background: "#333", color: "#fff", border: "none", borderRadius: 6, padding: "8px 32px", cursor: "pointer", fontSize: 14 }}>
          閉じる
        </button>
      </div>
    </div>
  )
}

export default function ClosetPage() {
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [selectedDrawer, setSelectedDrawer] = useState<Drawer | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [url, setUrl] = useState("")
  const [memo, setMemo] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [newShelfName, setNewShelfName] = useState("")
  const [newDrawerName, setNewDrawerName] = useState("")
  const [editingShelf, setEditingShelf] = useState<string | null>(null)
  const [editingDrawer, setEditingDrawer] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userPlan, setUserPlan] = useState<string>("free")

  useEffect(() => { loadShelves() }, [])

  const loadShelves = async () => {
    const res = await fetch("/api/shelves")
    const data = await res.json()
    if (data.error === "Unauthorized") { window.location.href = "/login"; return }
    setShelves(data.shelves || [])
    if (data.plan) setUserPlan(data.plan)
  }

  const limits = getLimits(userPlan)
  const adsInterval = limits.adsInterval
  const adSize = adsInterval >= 20 ? "minimal" : adsInterval >= 10 ? "reduced" : "full"

  const loadItems = async (drawer: Drawer) => {
    setSelectedDrawer(drawer)
    setSidebarOpen(false)
    const res = await fetch("/api/items?drawer_id=" + drawer.id)
    const data = await res.json()
    setItems(data.items || [])
  }

  const addShelf = async () => {
    if (!newShelfName || shelves.length >= limits.shelves) return
    const res = await fetch("/api/shelves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newShelfName }) })
    const data = await res.json()
    if (data.shelf) { setShelves((prev) => [...prev, { ...data.shelf, drawers: [] }]); setNewShelfName("") }
  }

  const deleteShelf = async (id: string) => {
    if (!confirm("この棚を削除しますか？中の引き出しも全て削除されます。")) return
    await fetch("/api/shelves?id=" + id, { method: "DELETE" })
    setShelves((prev) => prev.filter((s) => s.id !== id))
    if (selectedDrawer && shelves.find((s) => s.id === id)?.drawers.find((d) => d.id === selectedDrawer.id)) { setSelectedDrawer(null); setItems([]) }
  }

  const addDrawer = async (shelfId: string) => {
    if (!newDrawerName) return
    const res = await fetch("/api/drawers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newDrawerName, shelf_id: shelfId }) })
    const data = await res.json()
    if (data.drawer) { setShelves((prev) => prev.map((s) => s.id === shelfId ? { ...s, drawers: [...s.drawers, data.drawer] } : s)); setNewDrawerName("") }
    else { setErrorMessage(data.error || "エラー") }
  }

  const deleteDrawer = async (id: string, shelfId: string) => {
    if (!confirm("この引き出しを削除しますか？")) return
    await fetch("/api/drawers?id=" + id, { method: "DELETE" })
    setShelves((prev) => prev.map((s) => s.id === shelfId ? { ...s, drawers: s.drawers.filter((d) => d.id !== id) } : s))
    if (selectedDrawer?.id === id) { setSelectedDrawer(null); setItems([]) }
  }

  const renameShelf = async (id: string) => {
    await fetch("/api/shelves", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editName }) })
    setShelves((prev) => prev.map((s) => s.id === id ? { ...s, name: editName } : s))
    setEditingShelf(null)
  }

  const renameDrawer = async (id: string) => {
    await fetch("/api/drawers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editName }) })
    setShelves((prev) => prev.map((s) => ({ ...s, drawers: s.drawers.map((d) => d.id === id ? { ...d, name: editName } : d) })))
    setEditingDrawer(null)
  }

  const saveItem = async () => {
    if (!url || !selectedDrawer) return
    setLoading(true)
    setErrorMessage("")
    try {
      const res = await fetch("/api/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, drawer_id: selectedDrawer.id, memo }) })
      const data = await res.json()
      if (data.success) {
        setItems((prev) => [data.item, ...prev])
        setUrl("")
        setMemo("")
        setShowSaveModal(true) // 保存完了モーダルを表示（広告付き）
      } else {
        setErrorMessage(data.error || "エラーが発生しました")
      }
    } catch { setErrorMessage("エラーが発生しました") }
    finally { setLoading(false) }
  }

  const deleteItem = async (id: string) => {
    await fetch("/api/items?id=" + id, { method: "DELETE" })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const Sidebar = () => (
    <div style={{ width: 260, background: "#1a1a1a", color: "#fff", padding: 16, overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: "bold" }}>🗄 CloZett</h2>
        <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 12 }}>ログアウト</button>
      </div>
      {shelves.map((shelf) => (
        <div key={shelf.id} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {editingShelf === shelf.id ? (
              <>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ flex: 1, padding: 4, borderRadius: 4, border: "none", fontSize: 13 }} />
                <button onClick={() => renameShelf(shelf.id)} style={{ background: "#555", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>✓</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontWeight: "bold", fontSize: 14 }}>📦 {shelf.name}</span>
                <button onClick={() => { setEditingShelf(shelf.id); setEditName(shelf.name) }} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 12 }}>✏️</button>
                <button onClick={() => deleteShelf(shelf.id)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 12 }}>🗑</button>
              </>
            )}
          </div>
          {shelf.drawers.map((drawer) => (
            <div key={drawer.id} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4, paddingLeft: 12 }}>
              {editingDrawer === drawer.id ? (
                <>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ flex: 1, padding: 4, borderRadius: 4, border: "none", fontSize: 12 }} />
                  <button onClick={() => renameDrawer(drawer.id)} style={{ background: "#555", color: "#fff", border: "none", borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}>✓</button>
                </>
              ) : (
                <>
                  <button onClick={() => loadItems(drawer)} style={{ flex: 1, textAlign: "left", background: selectedDrawer?.id === drawer.id ? "#444" : "none", color: "#ccc", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 13 }}>
                    🗂 {drawer.name}
                  </button>
                  <button onClick={() => { setEditingDrawer(drawer.id); setEditName(drawer.name) }} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 11 }}>✏️</button>
                  <button onClick={() => deleteDrawer(drawer.id, shelf.id)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 11 }}>🗑</button>
                </>
              )}
            </div>
          ))}
          <div style={{ paddingLeft: 12, marginTop: 4, display: "flex", gap: 4 }}>
            <input value={newDrawerName} onChange={(e) => setNewDrawerName(e.target.value)} placeholder="引き出しを追加" style={{ flex: 1, padding: 4, borderRadius: 4, border: "1px solid #444", background: "#333", color: "#fff", fontSize: 12 }} />
            <button onClick={() => addDrawer(shelf.id)} style={{ background: "#555", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>+</button>
          </div>
        </div>
      ))}
      {shelves.length < limits.shelves && (
        <div style={{ marginTop: 16, display: "flex", gap: 4 }}>
          <input value={newShelfName} onChange={(e) => setNewShelfName(e.target.value)} placeholder="棚を追加" style={{ flex: 1, padding: 4, borderRadius: 4, border: "1px solid #444", background: "#333", color: "#fff", fontSize: 12 }} />
          <button onClick={addShelf} style={{ background: "#555", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>+</button>
        </div>
      )}
      {shelves.length >= limits.shelves && <p style={{ fontSize: 11, color: "#666", marginTop: 8 }}>棚の上限（{limits.shelves}つ）に達しました</p>}
    </div>
  )

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif", position: "relative" }}>
      {/* 保存完了モーダル（広告付き） */}
      {showSaveModal && <SaveSuccessModal onClose={() => setShowSaveModal(false)} adSize={adSize} />}
      {/* モバイルハンバーガー */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: "none", position: "fixed", top: 12, left: 12, zIndex: 100, background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontSize: 18 }} className="mobile-menu-btn">☰</button>
      {sidebarOpen && (<div onClick={() => setSidebarOpen(false)} style={{ display: "none", position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 90 }} className="mobile-overlay" />)}
      {/* サイドバー */}
      <div style={{ flexShrink: 0 }} className={sidebarOpen ? "sidebar-open" : "sidebar"}><Sidebar /></div>
      {/* メインエリア */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        {selectedDrawer ? (
          <>
            {/* 上部バナー広告（小・常時表示） */}
            <AdBanner size={adSize} />
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>🗂 {selectedDrawer.name}</h2>
            <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <input type="text" placeholder="URLを貼り付け" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
              <input type="text" placeholder="メモ（任意）" value={memo} onChange={(e) => setMemo(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
              <button onClick={saveItem} disabled={loading} style={{ background: "#333", color: "#fff", padding: "8px 24px", borderRadius: 4, border: "none", cursor: "pointer" }}>{loading ? "保存中..." : "保存する"}</button>
              {errorMessage && <p style={{ marginTop: 8, color: "red", fontSize: 13 }}>{errorMessage}</p>}
            </div>
            <div>
              {items.map((item, index) => (
                <>
                  {index > 0 && index % adsInterval === 0 && (
                    <AdBanner key={"ad-" + index} size={adSize} />
                  )}
                  <div key={item.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 12, display: "flex", gap: 12, position: "relative" }}>
                    {item.thumbnail && <img src={item.thumbnail} alt={item.title} style={{ width: 120, height: 68, objectFit: "cover", borderRadius: 4 }} />}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: "bold", marginBottom: 4 }}>{item.title}</p>
                      {item.memo && <p style={{ color: "#666", fontSize: 14 }}>{item.memo}</p>}
                      <p style={{ fontSize: 12, color: "#999" }}>{item.site}</p>
                      {item.is_playable ? <span style={{ fontSize: 12, color: "green" }}>▶ 再生可</span> : <a href={item.url} target="_blank" style={{ fontSize: 12, color: "#666" }}>外部で開く</a>}
                    </div>
                    <button onClick={() => deleteItem(item.id)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 16 }}>🗑</button>
                  </div>
                </>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999" }}>
            <p>左の引き出しを選択してください</p>
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
          .mobile-overlay { display: block !important; }
          .sidebar { display: none; }
          .sidebar-open { display: block; position: fixed; left: 0; top: 0; height: 100vh; z-index: 95; width: 260px; }
        }
        @media (min-width: 769px) { .sidebar { display: block; } }
      `}</style>
    </div>
  )
}
