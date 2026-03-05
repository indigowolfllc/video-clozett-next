"use client"
import { useState, useEffect } from "react"

type Drawer = { id: string; name: string; shelf_id: string }
type Shelf = { id: string; name: string; drawers: Drawer[] }
type Item = { id: string; url: string; title: string; thumbnail: string; site: string; is_playable: boolean; memo: string }

function AdSlot({ type }: { type: "banner" | "card" }) {
  if (type === "banner") {
    return (
      <div style={{ background: "#f0f0f0", border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16, textAlign: "center", color: "#999", fontSize: 12 }}>
        📢 広告スペース（728×90）
      </div>
    )
  }
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 12, background: "#fafafa", textAlign: "center", color: "#999", fontSize: 12 }}>
      📢 広告（300×250）
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
  const [message, setMessage] = useState("")
  const [newShelfName, setNewShelfName] = useState("")
  const [newDrawerName, setNewDrawerName] = useState("")
  const [editingShelf, setEditingShelf] = useState<string | null>(null)
  const [editingDrawer, setEditingDrawer] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  useEffect(() => { loadShelves() }, [])

  const loadShelves = async () => {
    const res = await fetch("/api/shelves")
    const data = await res.json()
    setShelves(data.shelves || [])
  }

  const loadItems = async (drawer: Drawer) => {
    setSelectedDrawer(drawer)
    const res = await fetch("/api/items?drawer_id=" + drawer.id)
    const data = await res.json()
    setItems(data.items || [])
  }

  const addShelf = async () => {
    if (!newShelfName || shelves.length >= 3) return
    const res = await fetch("/api/shelves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newShelfName }),
    })
    const data = await res.json()
    if (data.shelf) {
      setShelves((prev) => [...prev, { ...data.shelf, drawers: [] }])
      setNewShelfName("")
    }
  }

  const deleteShelf = async (id: string) => {
    if (!confirm("この棚を削除しますか？中の引き出しも全て削除されます。")) return
    await fetch("/api/shelves?id=" + id, { method: "DELETE" })
    setShelves((prev) => prev.filter((s) => s.id !== id))
    if (selectedDrawer && shelves.find((s) => s.id === id)?.drawers.find((d) => d.id === selectedDrawer.id)) {
      setSelectedDrawer(null)
      setItems([])
    }
  }

  const addDrawer = async (shelfId: string) => {
    if (!newDrawerName) return
    const res = await fetch("/api/drawers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDrawerName, shelf_id: shelfId }),
    })
    const data = await res.json()
    if (data.drawer) {
      setShelves((prev) => prev.map((s) =>
        s.id === shelfId ? { ...s, drawers: [...s.drawers, data.drawer] } : s
      ))
      setNewDrawerName("")
    } else {
      setMessage(data.error || "エラー")
    }
  }

  const deleteDrawer = async (id: string, shelfId: string) => {
    if (!confirm("この引き出しを削除しますか？")) return
    await fetch("/api/drawers?id=" + id, { method: "DELETE" })
    setShelves((prev) => prev.map((s) =>
      s.id === shelfId ? { ...s, drawers: s.drawers.filter((d) => d.id !== id) } : s
    ))
    if (selectedDrawer?.id === id) { setSelectedDrawer(null); setItems([]) }
  }

  const renameShelf = async (id: string) => {
    await fetch("/api/shelves", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName }),
    })
    setShelves((prev) => prev.map((s) => s.id === id ? { ...s, name: editName } : s))
    setEditingShelf(null)
  }

  const renameDrawer = async (id: string) => {
    await fetch("/api/drawers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName }),
    })
    setShelves((prev) => prev.map((s) => ({
      ...s,
      drawers: s.drawers.map((d) => d.id === id ? { ...d, name: editName } : d)
    })))
    setEditingDrawer(null)
  }

  const saveItem = async () => {
    if (!url || !selectedDrawer) return
    setLoading(true)
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          drawer_id: selectedDrawer.id,
          user_id: "00000000-0000-0000-0000-000000000001",
          memo,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setItems((prev) => [data.item, ...prev])
        setUrl("")
        setMemo("")
        setMessage("保存しました")
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(data.error || "エラーが発生しました")
      }
    } catch {
      setMessage("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (id: string) => {
    await fetch("/api/items?id=" + id, { method: "DELETE" })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ width: 260, background: "#1a1a1a", color: "#fff", padding: 16, overflowY: "auto" }}>
        <h2 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>🗄 CloZett</h2>

        {shelves.map((shelf) => (
          <div key={shelf.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {editingShelf === shelf.id ? (
                <>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    style={{ flex: 1, padding: 4, borderRadius: 4, border: "none", fontSize: 13 }} />
                  <button onClick={() => renameShelf(shelf.id)} style={{ background: "#555", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>✓</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontWeight: "bold", fontSize: 14 }}>📦 {shelf.name}</span>
                  <button onClick={() => { setEditingShelf(shelf.id); setEditName(shelf.name) }}
                    style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 12 }}>✏️</button>
                  <button onClick={() => deleteShelf(shelf.id)}
                    style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 12 }}>🗑</button>
                </>
              )}
            </div>

            {shelf.drawers.map((drawer) => (
              <div key={drawer.id} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4, paddingLeft: 12 }}>
                {editingDrawer === drawer.id ? (
                  <>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)}
                      style={{ flex: 1, padding: 4, borderRadius: 4, border: "none", fontSize: 12 }} />
                    <button onClick={() => renameDrawer(drawer.id)} style={{ background: "#555", color: "#fff", border: "none", borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}>✓</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => loadItems(drawer)}
                      style={{ flex: 1, textAlign: "left", background: selectedDrawer?.id === drawer.id ? "#444" : "none", color: "#ccc", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 13 }}>
                      🗂 {drawer.name}
                    </button>
                    <button onClick={() => { setEditingDrawer(drawer.id); setEditName(drawer.name) }}
                      style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 11 }}>✏️</button>
                    <button onClick={() => deleteDrawer(drawer.id, shelf.id)}
                      style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 11 }}>🗑</button>
                  </>
                )}
              </div>
            ))}

            <div style={{ paddingLeft: 12, marginTop: 4, display: "flex", gap: 4 }}>
              <input value={newDrawerName} onChange={(e) => setNewDrawerName(e.target.value)}
                placeholder="引き出しを追加"
                style={{ flex: 1, padding: 4, borderRadius: 4, border: "1px solid #444", background: "#333", color: "#fff", fontSize: 12 }} />
              <button onClick={() => addDrawer(shelf.id)}
                style={{ background: "#555", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>+</button>
            </div>
          </div>
        ))}

        {shelves.length < 3 && (
          <div style={{ marginTop: 16, display: "flex", gap: 4 }}>
            <input value={newShelfName} onChange={(e) => setNewShelfName(e.target.value)}
              placeholder="棚を追加"
              style={{ flex: 1, padding: 4, borderRadius: 4, border: "1px solid #444", background: "#333", color: "#fff", fontSize: 12 }} />
            <button onClick={addShelf}
              style={{ background: "#555", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>+</button>
          </div>
        )}
        {shelves.length >= 3 && <p style={{ fontSize: 11, color: "#666", marginTop: 8 }}>棚の上限（3つ）に達しました</p>}
      </div>

      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        {selectedDrawer ? (
          <>
            <AdSlot type="banner" />
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>🗂 {selectedDrawer.name}</h2>
            <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <input type="text" placeholder="URLを貼り付け" value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
              <input type="text" placeholder="メモ（任意）" value={memo}
                onChange={(e) => setMemo(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
              <button onClick={saveItem} disabled={loading}
                style={{ background: "#333", color: "#fff", padding: "8px 24px", borderRadius: 4, border: "none", cursor: "pointer" }}>
                {loading ? "保存中..." : "保存する"}
              </button>
              {message && <p style={{ marginTop: 8, color: "green" }}>{message}</p>}
            </div>

            <div>
              {items.map((item, index) => (
                <>
                  {index > 0 && index % 5 === 0 && <AdSlot key={"ad-" + index} type="card" />}
                  <div key={item.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 12, display: "flex", gap: 12, position: "relative" }}>
                    {item.thumbnail && <img src={item.thumbnail} alt={item.title} style={{ width: 120, height: 68, objectFit: "cover", borderRadius: 4 }} />}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: "bold", marginBottom: 4 }}>{item.title}</p>
                      {item.memo && <p style={{ color: "#666", fontSize: 14 }}>{item.memo}</p>}
                      <p style={{ fontSize: 12, color: "#999" }}>{item.site}</p>
                      {item.is_playable
                        ? <span style={{ fontSize: 12, color: "green" }}>▶ 再生可</span>
                        : <a href={item.url} target="_blank" style={{ fontSize: 12, color: "#666" }}>外部で開く</a>
                      }
                    </div>
                    <button onClick={() => deleteItem(item.id)}
                      style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 16 }}>🗑</button>
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
    </div>
  )
}