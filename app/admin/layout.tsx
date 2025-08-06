"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar, MobileSidebarTrigger } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { useAuthStore } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { useMediaQuery } from "@/hooks/use-mobile"
import { useContextMenu } from "@/hooks/use-context-menu"
import { ContextMenu, MenuItem } from "@/components/ui/context-menu"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 1024px)")
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const { anchorPoint, show, setShow } = useContextMenu()

  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!loading && !user) {
        router.push("/admin-auth/auth/login")
        return
      }

      if (user) {
        // Check if user is admin
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        if (!profile || profile.role !== "admin") {
          router.push("/")
          return
        }
      }
    }

    checkAdminAccess()
  }, [user, loading, router])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const getMenuItems = (): MenuItem[] => {
    return [
      { label: "Refresh", action: () => window.location.reload() },
      { isSeparator: true },
      { label: "Dashboard", href: "/admin" },
      { label: "Products", href: "/admin/products" },
      { label: "Orders", href: "/admin/orders" },
      { label: "Customers", href: "/admin/customers" },
      { label: "Analytics", href: "/admin/analytics" },
      { label: "Settings", href: "/admin/settings" },
    ]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        isMobile={isMobile} 
      />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        !isMobile && sidebarOpen && "ml-64",
        !isMobile && !sidebarOpen && "ml-16",
        isMobile && "ml-0"
      )}>
        <AdminHeader sidebarTrigger={<MobileSidebarTrigger onToggle={toggleSidebar} />} />
        <main className="p-6">
          {children}
          {show && <ContextMenu items={getMenuItems()} x={anchorPoint.x} y={anchorPoint.y} onClose={() => setShow(false)} />}
        </main>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}
