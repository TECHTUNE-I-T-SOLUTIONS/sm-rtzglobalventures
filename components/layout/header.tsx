"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
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
  Book
} from "lucide-react"
import toast from "react-hot-toast"

import { motion, AnimatePresence } from "framer-motion"
import { useRef } from "react"
import { LogoutModal } from "@/components/modals/logout-modal"

export function Header() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [showConfirmLogoutModal, setShowConfirmLogoutModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMenuOpen])

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
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
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
      router.push("/")
    } catch (error) {
      toast.error("Failed to sign out")
    }
  }

  const navItems = [
    {
      label: "Products",
      href: "/products",
      icon: ShoppingBag,
      children: [
        { label: "All Products", href: "/products" },
        { label: "Computers & Tech", href: "/products/computers" },
        { label: "Books & Academic", href: "/products/books" },
        { label: "E-books", href: "/products/ebooks" },
      ],
    },
    {
      label: "Business Center",
      href: "/business-center",
      icon: Building2,
    },
    {
      label: "About",
      href: "/about",
      icon: Info,
    },
    {
      label: "Contact",
      href: "/contact",
      icon: Phone,
    },
    {
      label: "Posts",
      href: "/posts",
      icon: Rss,
    },
  ]

  const userMenuItems = [
    { label: "Dashboard", href: "/dashboard", icon: User },
    { label: "Orders", href: "/dashboard/orders", icon: Package },
    { label: "My E-books", href: "/dashboard/ebooks", icon: Book },
    { label: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
    { label: "Profile", href: "/dashboard/profile", icon: Settings },
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { label: "My Feedback", href: "/feedback", icon: MessageSquare },
    { label: "Disputes", href: "/dashboard/disputes", icon: AlertCircle },
  ]

  return (
    <header className="sticky top-0 z-[40] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="border-b bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2 text-sm">
            <div className="hidden md:flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>Ilorin, Nigeria</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>+234 815 664 5378</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Mon-Fri 6AM-6PM</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                New Website Launch!
              </Badge>
              <Badge variant="outline" className="text-xs animate-pulse">
                in beta
              </Badge>
              <span className="hidden sm:inline">Welcome to Sm@rtz Global Ventures</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between py-2 sm:py-4 gap-2 whitespace-nowrap">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-1 sm:space-x-2 min-w-fit">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-transparent rounded-lg flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Sm@rtz Global Logo"
                  className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Sm@rtz Global
                </span>
                <div className="text-xs text-muted-foreground -mt-1">Ventures</div>
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
              {/* Mobile Search */}
              <Button
                variant="ghost"
                size="icon"
                className="p-1 sm:p-2 md:hidden"
                onClick={() => {
                  const searchInput = document.getElementById("mobile-search")
                  if (searchInput) searchInput.focus()
                }}
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              {/* Theme Toggle */}
              <div className="scale-[0.85] sm:scale-100">
                <ThemeToggle />
              </div>

              {/* Notifications */}
              {user && (
                <Button variant="ghost" size="icon" className="p-1 sm:p-2 relative">
                  <Link href="/dashboard/notifications">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 text-[10px] p-0">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                </Button>
              )}

              {/* Cart */}
              <div className="scale-90 sm:scale-100">
                <CartIcon />
              </div>

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
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button size="sm" className="px-2 text-[10px] sm:text-sm" asChild>
                    <Link href="/auth/signup">Sign Up</Link>
                  </Button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto p-1 sm:p-2 lg:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                ref={menuButtonRef}
              >
                {isMenuOpen ? (
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>


        {/* Navigation - Desktop */}
        <nav className="hidden lg:flex items-center justify-between border-t py-3">
          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                    pathname === item.href 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.children && <ChevronDown className="bg-white dark:bg-black h-3 w-3" />}
                </Link>

                {item.children && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-black border rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-white hover:dark:bg-black hover:bg-opacity-10 transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/support" className="hover:text-primary transition-colors">
              Customer Support
            </Link>
            <span>•</span>
            <Link href="/business-center" className="hover:text-primary transition-colors">
              Business Services
            </Link>
          </div>
        </nav>

        {/* Mobile Search */}
        <div className="md:hidden py-3 border-t">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="mobile-search"
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </form>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/5 z-[999] lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-80 max-w-[85vw] bg-white dark:bg-black border-r shadow-xl z-[9999] lg:hidden"
              ref={sidebarRef}
            >
              <div className="flex flex-col h-full">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-transparent rounded-lg flex items-center justify-center">
                      <img src="/logo.png" alt="Sm@rtz Global Logo" className="h-8 w-8 object-contain" />
                    </div>
                    <span className="text-lg font-bold text-primary">Menu</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMenuOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <nav className="space-y-4">
                    {navItems.map((item) => (
                      <div key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 text-base font-medium py-3 px-4 rounded-lg transition-colors ${
                            pathname === item.href 
                              ? "bg-primary text-primary-foreground" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <item.icon className="bg-white dark:bg-black h-5 w-5" />
                          {item.label}
                        </Link>
                        {item.children && (
                          <div className="bg-white dark:bg-black ml-8 space-y-2 mt-2">
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                className="block text-sm text-muted-foreground py-2 px-4 hover:text-foreground hover:bg-white hover:dark:bg-black rounded-lg transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </nav>

                  {/* Additional Links */}
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-6 space-y-2">
                    <Link
                      href="/support"
                      className="block text-sm text-muted-foreground py-2 px-4 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Customer Support
                    </Link>
                    <Link
                      href="/business-center"
                      className="block text-sm text-muted-foreground py-2 px-4 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Business Services
                    </Link>
                  </div>

                  {/* User Section */}
                  {user && (
                    <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-6">
                      <div className="px-4 py-2">
                        <p className="font-semibold text-sm">{user.user_metadata?.full_name || "User"}</p>
                        <p className="text-xs text-muted-foreground break-words overflow-wrap">{user.email}</p>
                      </div>
                      <div className="space-y-1 mt-2">
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        ))}
                        <button
                          onClick={() => {
                            requestSignOut()
                            setIsMenuOpen(false)
                          }}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors w-full text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <LogoutModal
        isOpen={showConfirmLogoutModal}
        onClose={() => setShowConfirmLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmText="Log Out"
        variant="destructive"
      />
    </header>
  )
}