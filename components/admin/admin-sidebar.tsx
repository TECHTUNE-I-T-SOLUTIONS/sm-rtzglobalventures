"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  FileText,
  AlertTriangle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MessageSquare,
  Newspaper
} from "lucide-react"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "E-books",
    href: "/admin/ebooks",
    icon: FileText,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    title: "Transactions",
    href: "/admin/transactions",
    icon: DollarSign,
  },
  {
    title: "Disputes",
    href: "/admin/disputes",
    icon: AlertTriangle,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: FileText,
  },
  {
    title: "Feedback",
    href: "/admin/feedback",
    icon: MessageSquare,
  },
  {
    title: "Posts",
    href: "/admin/posts",
    icon: Newspaper,
  },
  {
    title: "Services",
    href: "/admin/services",
    icon: FileText,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

interface AdminSidebarProps {
  isOpen: boolean
  onToggle: () => void
  isMobile: boolean
}

export function AdminSidebar({ isOpen, onToggle, isMobile }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-white dark:bg-black border-r transition-all duration-300 ease-in-out",
          isMobile
            ? "w-64 transform translate-x-0"
            : "w-64",
          isMobile && !isOpen && "-translate-x-full",
          !isMobile && !isOpen && "w-16",
          !isMobile && isOpen && "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b h-16">
            <div className={cn(
              "flex items-center transition-all duration-300 flex-1 min-w-0",
              (!isOpen && !isMobile) && "justify-center"
            )}>
              <div className="h-10 w-10 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain rounded-lg" />
              </div>
              <h2 className={cn(
                "font-semibold ml-3 truncate transition-opacity duration-300",
                (!isOpen && !isMobile) && "opacity-0 ml-0"
              )}>
                Admin Panel
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 ml-2 flex-shrink-0"
            >
              {isMobile ? (
                <X className="h-4 w-4" />
              ) : (
                isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground group",
                  pathname === item.href 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:text-foreground",
                  (!isOpen && !isMobile) && "justify-center px-2"
                )}
                onClick={onToggle}
              >
                <item.icon className={cn(
                  "h-4 w-4 transition-all duration-200",
                  (!isOpen && !isMobile) ? "mr-0" : "mr-3"
                )} />
                <span className={cn(
                  "transition-all duration-200",
                  (!isOpen && !isMobile) && "opacity-0 w-0 overflow-hidden"
                )}>
                  {item.title}
                </span>
                {(!isOpen && !isMobile) && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.title}
                  </div>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}

export function MobileSidebarTrigger({ onToggle }: { onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="lg:hidden h-8 w-8 p-0"
    >
      <Menu className="h-4 w-4" />
    </Button>
  )
}
