import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AbrantesScale CRM",
  description: "CRM pessoal para gestão de leads e pipeline de vendas",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Aplica o tema (dia/noite) antes do paint para evitar flash. Default: dia. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='night'){document.documentElement.classList.remove('day')}else{document.documentElement.classList.add('day')}}catch(e){document.documentElement.classList.add('day')}})()",
          }}
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
