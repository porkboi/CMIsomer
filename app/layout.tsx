import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import '@/styles/globals.css'
import { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next";
const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}


