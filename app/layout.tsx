import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientLayout } from "./client-layout"

const inter = Inter({ subsets: ["latin"] })

// Function to fetch site settings
async function getSiteSettings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/general-site-settings`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    if (!res.ok) {
      console.error(`Failed to fetch site settings: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings();

  return {
    title: siteSettings?.site_name || "Sm@rtz Global V",
    description: siteSettings?.site_description || "Leading provider of computer accessories, books, and business services. Shop computers, books, and get professional document services. (in beta)",
    keywords: "computer accessories, bookstore, business services, printing, Ilorin, Nigeria",
    authors: [{ name: siteSettings?.site_name || "Sm@rtz Global Ventures" }],
    openGraph: {
      title: siteSettings?.site_name || "Sm@rtz Global V(in beta)",
      description: siteSettings?.site_description || "Your One-Stop Digital Solutions",
      type: "website",
      locale: "en_US",
    },
    icons: {
      icon: siteSettings?.favicon_url || "/favicon.ico",
    }
  };
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