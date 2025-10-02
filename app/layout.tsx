import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Unibookmark - Intelligent Bookmark Manager",
  description: "A modern, AI-powered bookmark manager with advanced organization and search capabilities",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased h-full flex flex-col`} style={{ fontFamily: 'Inter, var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"' }}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange className="flex-1 h-full">
          <Suspense fallback={null}>{children}</Suspense>
        </ThemeProvider>
        <Analytics />
        <script src="https://www.youtube.com/iframe_api"></script>
      </body>
    </html>
  )
}
