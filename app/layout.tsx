import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Video CloZett - 動画URLをクローゼットに整理",
  description: "YouTube・Vimeo・TikTok・Instagram。バラバラに保存していた動画URLを、棚と引き出しで美しく整理。",
  openGraph: {
    title: "Video CloZett",
    description: "動画URLをクローゼットに整理",
    url: "https://video-clozett-next.vercel.app",
    siteName: "Video CloZett",
    locale: "ja_JP",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={geistSans.variable + " " + geistMono.variable}>
        {children}
      </body>
    </html>
  );
}