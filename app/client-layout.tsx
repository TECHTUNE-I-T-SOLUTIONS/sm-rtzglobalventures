"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Providers } from "./providers"
import { Toaster } from "react-hot-toast"
import { CookieConsent } from "@/components/ui/cookie-consent"
import { CustomerSupportChat } from "@/components/customer-support/chat"
import { ConditionalFeedbackButton } from "@/components/feedback/conditional-feedback-button"
import { CartProvider } from "@/contexts/cart-context"
import { useAuthStore } from "@/hooks/use-auth"
import { useContextMenu } from "@/hooks/use-context-menu"
import { ContextMenu, MenuItem } from "@/components/ui/context-menu"

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuthStore()
  const { anchorPoint, show, setShow } = useContextMenu()
  const pathname = usePathname()

  const isAdminPage = pathname.startsWith("/admin")

  const getMenuItems = (): MenuItem[] => {
    const baseItems: MenuItem[] = [
      { label: "Refresh", action: () => window.location.reload() },
      { isSeparator: true },
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ];

    if (user) {
      return [
        ...baseItems,
        { isSeparator: true },
        { label: "Dashboard", href: "/dashboard" },
        { label: "My Orders", href: "/dashboard/orders" },
        { label: "My Services", href: "/dashboard/services" },
        { label: "My Profile", href: "/dashboard/profile" },
      ];
    }

    return baseItems;
  };

  return (
    <Providers>
      <CartProvider>
        {children}
        {show && !isAdminPage && <ContextMenu items={getMenuItems()} x={anchorPoint.x} y={anchorPoint.y} onClose={() => setShow(false)} />}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            },
          }}
        />
        <CookieConsent />
        <CustomerSupportChat />
        <ConditionalFeedbackButton />
      </CartProvider>
    </Providers>
  )
}
