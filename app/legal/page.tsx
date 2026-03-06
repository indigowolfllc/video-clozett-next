export default function LegalPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px", fontFamily: "sans-serif", lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 48 }}>利用規約・プライバシーポリシー</h1>

      <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>利用規約</h2>

      <h3 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>第1条（サービスの概要）</h3>
      <p style={{ marginBottom: 16, color: "#444" }}>Video CloZett（以下「本サービス」）は、動画URLを整理・保存するためのウェブサービスです。</p>

      <h3 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>第2条（利用登録）</h3>
      <p style={{ marginBottom: 16, color: "#444" }}>本サービスはGoogleアカウントによる認証を使用します。利用登録はGoogleアカウントでのログインをもって完了とします。</p>

      <h3 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>第3条（禁止事項）</h3>
      <p style={{ marginBottom: 16, color: "#444" }}>以下の行為を禁止します。</p>
      <ul style={{ marginBottom: 16, color: "#444", paddingLeft: 24 }}>
        <li>法令または公序良俗に違反する行為</li>
        <li>本サービスの運営を妨害する行為</li>
        <li>他のユーザーへの不正アクセス</li>
        <li>スパム・大量の自動アクセス</li>
      </ul>

      <h3 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>第4条（免責事項）</h3>
      <p style={{ marginBottom: 32, color: "#444" }}>本サービスは現状有姿で提供されます。サービスの中断・終了・データ消失について、運営者は責任を負いません。</p>

      <hr style={{ marginBottom: 32, border: "none", borderTop: "1px solid #eee" }} />

      <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>プライバシーポリシー</h2>

      <h3 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>収集する情報</h3>
      <ul style={{ marginBottom: 16, color: "#444", paddingLeft: 24 }}>
        <li>Googleアカウントのメールアドレス・表示名</li>
        <li>保存したURL・メモ・棚・引き出しのデータ</li>
        <li>アクセスログ（IPアドレス・ブラウザ情報）</li>
      </ul>

      <h3 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>情報の利用目的</h3>
      <ul style={{ marginBottom: 16, color: "#444", paddingLeft: 24 }}>
        <li>本サービスの提供・改善</li>
        <li>ユーザーサポート</li>
        <li>広告配信（Google AdSense）</li>
      </ul>

      <h3 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>第三者提供</h3>
      <p style={{ marginBottom: 16, color: "#444" }}>法令に基づく場合を除き、ユーザーの個人情報を第三者に提供しません。</p>

      <h3 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Cookie・広告</h3>
      <p style={{ marginBottom: 16, color: "#444" }}>本サービスはGoogle AdSenseによる広告を表示します。広告配信にCookieが使用される場合があります。</p>

      <h3 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>お問い合わせ</h3>
      <p style={{ marginBottom: 32, color: "#444" }}>プライバシーに関するお問い合わせは、サービス内のお問い合わせフォームよりご連絡ください。</p>

      <p style={{ color: "#999", fontSize: 12 }}>最終更新：2025年3月</p>

      <div style={{ marginTop: 32 }}>
        <a href="/" style={{ color: "#666", fontSize: 14 }}>← トップに戻る</a>
      </div>
    </div>
  )
}