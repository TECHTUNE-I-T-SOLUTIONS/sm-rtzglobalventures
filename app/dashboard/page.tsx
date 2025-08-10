"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { ShoppingBag, BookOpen, Building2, User, Bell, Heart } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

export default function DashboardPage() {
  const { user, loading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success("Logged out successfully")
      router.push("/")
    } catch (error) {
      toast.error("Error logging out")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const dashboardItems = [
    {
      title: "My Orders",
      description: "View and track your orders",
      icon: ShoppingBag,
      href: "/dashboard/orders",
      color: "bg-blue-500",
    },
    {
      title: "My E-books",
      description: "Access your acquired ebooks",
      icon: BookOpen,
      href: "/dashboard/ebooks",
      color: "bg-indigo-500",
    },
    {
      title: "Wishlist",
      description: "Your saved items",
      icon: Heart,
      href: "/dashboard/wishlist",
      color: "bg-red-500",
    },
    {
      title: "Business Services",
      description: "Manage your service requests",
      icon: Building2,
      href: "/dashboard/services",
      color: "bg-purple-500",
    },
    {
      title: "Profile",
      description: "Update your account information",
      icon: User,
      href: "/dashboard/profile",
      color: "bg-green-500",
    },
    {
      title: "Notifications",
      description: "View your notifications",
      icon: Bell,
      href: "/dashboard/notifications",
      color: "bg-yellow-500",
    },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.user_metadata?.full_name || user.email}!</h1>
          <p className="text-muted-foreground">Manage your account and track your activities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardItems.map((item) => (
            <Link key={item.title} href={item.href}>
              <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <CardHeader>
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${item.color} rounded-lg mb-4`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/products/computers">
                <Button variant="outline" className="w-full bg-transparent">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Shop Computers
                </Button>
              </Link>
              <Link href="/products/books">
                <Button variant="outline" className="w-full bg-transparent">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Books
                </Button>
              </Link>
              <Link href="/business-center">
                <Button variant="outline" className="w-full bg-transparent">
                  <Building2 className="h-4 w-4 mr-2" />
                  Business Services
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} className="w-full bg-transparent">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
