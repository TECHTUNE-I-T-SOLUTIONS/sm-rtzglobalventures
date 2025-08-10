"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CartIcon } from "@/components/cart/cart-icon"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import {
  Search,
  User,
  LogOut,
  Settings,
  Package,
  Heart,
  Bell,
  Menu,
  X,
  ChevronDown,
  Building2,
  Phone,
  Info,
  ShoppingBag,
  MapPin,
  Clock,
  Star,
  MessageSquare,
  Rss,
  AlertCircle,
  Book,
  LayoutDashboard
} from "lucide-react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { LogoutModal } from "@/components/modals/logout-modal"

interface AdminHeaderProps {
  sidebarTrigger: React.ReactNode
}

export function AdminHeader({ sidebarTrigger }: AdminHeaderProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showConfirmLogoutModal, setShowConfirmLogoutModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) throw error
      setNotifications(data || [])
      setUnreadCount(data?.length || 0)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/admin/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  const requestSignOut = () => {
    setShowConfirmLogoutModal(true)
  }

  const confirmLogout = async () => {
    try {
      await signOut()
      toast.success("Signed out successfully")
      router.push("/admin-auth/auth/login")
    } catch (error) {
      toast.error("Failed to sign out")
    }
  }

  const userMenuItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2 sm:py-4 gap-2 whitespace-nowrap">
          {/* Mobile Sidebar Trigger */}
          <div className="lg:hidden flex items-center">
            {sidebarTrigger}
          </div>

          {/* Logo */}
          <Link href="/admin" className="flex items-center space-x-1 sm:space-x-2 min-w-fit">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-transparent rounded-lg flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Sm@rtz Global Logo"
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Admin Panel
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xs sm:max-w-md mx-2">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 h-8 sm:h-10 text-xs sm:text-sm"
              />
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-nowrap text-xs sm:text-sm min-w-fit">
            {/* Theme Toggle */}
            <div className="scale-[0.85] sm:scale-100">
              <ThemeToggle />
            </div>

            {/* Notifications */}
            {user && (
              <Button variant="ghost" size="icon" className="p-1 sm:p-2 relative">
                <Link href="/admin/notifications">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 text-[10px] p-0">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            )}

            {/* User Menu or Auth Buttons */}
            {user ? (
              <div className="relative z-[99]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-primary rounded-full flex items-center justify-center text-xs">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata?.full_name || user.email}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      user.user_metadata?.full_name?.charAt(0) ||
                      user.email?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <ChevronDown className="h-3 w-3 hidden sm:block" />
                </Button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-black border rounded-lg shadow-lg py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b">
                        <p className="font-semibold text-sm">{user.user_metadata?.full_name || "User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <nav className="py-1">
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        ))}
                      </nav>
                      <div className="border-t">
                        <button
                          onClick={requestSignOut}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 w-full text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 min-w-fit">
                <Button variant="ghost" size="sm" className="px-2 text-[10px] sm:text-sm" asChild>
                  <Link href="/admin-auth/auth/login">Sign In</Link>
                </Button>
                <Button size="sm" className="px-2 text-[10px] sm:text-sm" asChild>
                  <Link href="/admin-auth/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <LogoutModal
        isOpen={showConfirmLogoutModal}
        onClose={() => setShowConfirmLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of your admin account?"
        confirmText="Log Out"
        variant="destructive"
      />
    </header>
  )
}