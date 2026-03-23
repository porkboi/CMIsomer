import type React from "react"
import { Cormorant_Garamond, Manrope } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import '@/styles/globals.css'
import { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
})

const brandFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["500", "600", "700"],
})

export const metadata: Metadata = {
  title: 'CMIsomer - Party Management System',
  description: 'By the Tartan Cultural League',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${brandFont.variable} ${bodyFont.className}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="site-shell min-h-screen">
            <div className="site-bg-orb site-bg-orb-a" />
            <div className="site-bg-orb site-bg-orb-b" />
            <div className="site-bg-grid" />
            <SiteHeader />
            <main className="relative z-10">{children}</main>
            <SiteFooter />
          </div>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}

