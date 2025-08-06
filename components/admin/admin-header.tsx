"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuthStore } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { Bell, User, LogOut, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

interface AdminHeaderProps {
  sidebarTrigger?: React.ReactNode
}

export function AdminHeader({ sidebarTrigger }: AdminHeaderProps) {
  const { user } = useAuthStore()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success("Logged out successfully")
      router.push("/admin-auth/auth/login")
    } catch (error) {
      toast.error("Error logging out")
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {sidebarTrigger}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 sm:h-12 sm:w-12 object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-lg font-bold text-primary">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Sm@rtz Global Enterprise</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-sm font-bold text-primary">Admin</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <ThemeToggle />

          {/*
            Fetch notification count and navigate to ./notifications on click
          */}
          {(() => {
            const [notificationCount, setNotificationCount] = useState<number>(0);

            // Fetch notifications count on mount
            useEffect(() => {
              let isMounted = true;
              (async () => {
                const { count } = await supabase
                  .from("notifications")
                  .select("*", { count: "exact", head: true })
                  .eq("role", "admin")
                  .eq("is_read", false);
                if (isMounted && typeof count === "number") setNotificationCount(count);
              })();
              return () => { isMounted = false };
            }, []);

            return (
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => router.push("/admin/notifications")}
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Button>
            );
          })()}

          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowUserMenu(!showUserMenu)} 
              className="relative h-8 w-8 sm:h-10 sm:w-10"
            >
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white dark:bg-black border rounded-lg shadow-lg py-2 z-50">
                <div className="px-3 sm:px-4 py-2 border-b">
                  <p className="font-semibold text-sm sm:text-base truncate">{user?.user_metadata?.full_name || user?.email}</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
                <button
                  className="w-full px-3 sm:px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                  onClick={() => router.push("/admin/settings")}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-3 sm:px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-red-600 text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}