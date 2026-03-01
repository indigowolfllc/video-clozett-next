export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          CloZett
        </h1>
        <p className="text-gray-600 mb-6">
          あなた専用の動画URL引き出し
        </p>
        <a
          href="/dashboard"
          className="bg-black text-white px-6 py-3 rounded"
        >
          ダッシュボードへ
        </a>
      </div>
    </main>
  )
}
