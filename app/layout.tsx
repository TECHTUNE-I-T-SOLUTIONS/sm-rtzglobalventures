import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientLayout } from "./client-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sm@rtz Global Enterprise - Your One-Stop Digital Solutions (in beta)",
  description:
    "Leading provider of computer accessories, books, and business services. Shop computers, books, and get professional document services. (in beta)",
  keywords: "computer accessories, bookstore, business services, printing, Ilorin, Nigeria",
  authors: [{ name: "Sm@rtz Global Enterprise" }],
  openGraph: {
    title: "Sm@rtz Global Enterprise",
    description: "Your One-Stop Digital Solutions",
    type: "website",
    locale: "en_US",
  },
  icons: {
    icon: "/favicon.ico",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}