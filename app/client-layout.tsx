"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Providers } from "./providers"
import { Toaster } from "react-hot-toast"
import { CookieConsent } from "@/components/ui/cookie-consent"
import { CustomerSupportChat } from "@/components/customer-support/chat"
import { ConditionalFeedbackButton } from "@/components/feedback/conditional-feedback-button"
import PushSubscribeModal from '@/components/push/push-subscribe-modal'
import { CartProvider } from "@/contexts/cart-context"
import { useAuthStore } from "@/hooks/use-auth"
import { useContextMenu } from "@/hooks/use-context-menu"
import { ContextMenu, MenuItem } from "@/components/ui/context-menu"

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, setUser, setLoading } = useAuthStore()
  const { anchorPoint, show, setShow } = useContextMenu()
  const pathname = usePathname()

  const isAdminPage = pathname.startsWith("/admin")

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    // to fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      data.subscription?.unsubscribe()
    }
  }, [setUser, setLoading])

  const getMenuItems = (): MenuItem[] => {
    const baseItems: MenuItem[] = [
      { label: "Refresh", action: () => window.location.reload() },
      { label: "separator", isSeparator: true },
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ];

    if (user) {
      return [
        ...baseItems,
        { label: "separator", isSeparator: true },
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
        <div id="modal-root" /> {/* Added this line */}
  {/* Push subscription modal is mounted here so it overlays above the header */}
  <PushSubscribeModal />
        <CookieConsent />
        <CustomerSupportChat />
        <ConditionalFeedbackButton />
      </CartProvider>
    </Providers>
  )
}