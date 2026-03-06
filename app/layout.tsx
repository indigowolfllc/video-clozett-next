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
  title: "CloZett - タブ地獄とはおさらば。",
  description: "すべてのURLを、クローゼットに。YouTube・Vimeo・TikTok・Instagram・ニュース・レシピ・ブログ。あらゆるURLを棚と引き出しで美しく整理。",
  openGraph: {
    title: "CloZett",
    description: "すべてのURLを、クローゼットに。",
    url: "https://clozett.app",
    siteName: "CloZett",
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
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2882035303564987"
          crossOrigin="anonymous"
        />
      </head>
      <body className={geistSans.variable + " " + geistMono.variable}>
        {children}
      </body>
    </html>
  );
}
