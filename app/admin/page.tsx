"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"

interface Ebook {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  wishlistCount: number;
}

interface WishlistItem {
  product_id: string;
  products: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
  }[];
}

interface DashboardStats {
  totalCustomers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  recentOrders: any[]
  topProducts: any[] // Consider defining a more specific type for products if possible
  topEbooks: Ebook[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    topEbooks: [], // Initialize topEbooks here
    topProducts: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch customers count
      const { count: customersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "user")

      // Fetch products count
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)

      // Fetch orders count and revenue
      const { data: orders } = await supabase.from("orders").select("total_amount, created_at")

      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0

      // Fetch recent orders
      const { data: recentOrders } = await supabase
        .from("orders")
        .select(`
          *,
          profiles!orders_user_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(5)

      // Fetch top wishlisted ebooks
      const { data: topEbooksData, error: topEbooksError } = await supabase
        .from('wishlist_items')
        .select(`
          product_id,
          products (
            id,
            name,
            description,
            price,
            image_url
          )
        `)
        .eq('products.category', 'books'); // Filter for ebooks

      if (topEbooksError) {
        console.error("Error fetching top ebooks:", topEbooksError);
      }

      // Explicitly cast topEbooksData to WishlistItem[]
      const typedTopEbooksData: WishlistItem[] | null = topEbooksData;

      // Process the data to count wishlists per ebook
      const ebookWishlistCounts = typedTopEbooksData?.reduce((acc: Record<string, Ebook>, item: WishlistItem) => {
        const product = item.products && item.products.length > 0 ? item.products[0] : null;
        const ebookId = product?.id;

        if (ebookId && product) {
          acc[ebookId] = acc[ebookId] || { ...product, wishlistCount: 0 };
          acc[ebookId].wishlistCount++;
        }
        return acc;
      }, {} as Record<string, Ebook>);

      // Convert to array and sort by wishlist count, limit to top 5
      const sortedTopEbooks = Object.values(ebookWishlistCounts || {})
        .sort((a: any, b: any) => b.wishlistCount - a.wishlistCount)
        .slice(0, 5);

      setStats({
        totalCustomers: customersCount || 0,
        totalProducts: productsCount || 0,
        totalOrders: orders?.length || 0,
        totalRevenue,
        recentOrders: recentOrders || [],
        topProducts: [], // This remains for general products
        topEbooks: sortedTopEbooks,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      change: "+5%",
      changeType: "positive" as const,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      change: "+23%",
      changeType: "positive" as const,
    },
    {
      title: "Total Revenue",
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+18%",
      changeType: "positive" as const,
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Badge variant="secondary">Admin Panel</Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="bg-card border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  {stat.changeType === "positive" ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                  <div>
                    <p className="font-semibold">#{order.id.slice(-8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.profiles?.full_name || order.profiles?.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦{order.total_amount.toLocaleString()}</p>
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "default"
                          : order.status === "processing"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/products" className="p-4 border rounded-lg hover:bg-muted transition-colors text-left">
                <Package className="h-6 w-6 text-primary mb-2" />
                <p className="font-semibold">Add Product</p>
                <p className="text-sm text-muted-foreground">Create new product</p>
              </Link>
              <Link href="/admin/customers" className="p-4 border rounded-lg hover:bg-muted transition-colors text-left">
                <Users className="h-6 w-6 text-primary mb-2" />
                <p className="font-semibold">View Customers</p>
                <p className="text-sm text-muted-foreground">Manage customers</p>
              </Link>
              <Link href="/admin/orders" className="p-4 border rounded-lg hover:bg-muted transition-colors text-left">
                <ShoppingCart className="h-6 w-6 text-primary mb-2" />
                <p className="font-semibold">Process Orders</p>
                <p className="text-sm text-muted-foreground">Update order status</p>
              </Link>
              <Link href="/admin/analytics" className="p-4 border rounded-lg hover:bg-muted transition-colors text-left">
                <BarChart3 className="h-6 w-6 text-primary mb-2" />
                <p className="font-semibold">View Analytics</p>
                <p className="text-sm text-muted-foreground">Sales reports</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Ebooks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle>Top Wishlisted Ebooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topEbooks.length > 0 ? (
                stats.topEbooks.map((ebook) => (
                  <div key={ebook.id} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                    <div className="flex items-center space-x-4">
                      {ebook.image_url && (
                        <img src={ebook.image_url} alt={ebook.name} className="w-12 h-12 object-cover rounded-md" />
                      )}
                      <div>
                        <p className="font-semibold">{ebook.name}</p>
                        <p className="text-sm text-muted-foreground">Wishlisted: {ebook.wishlistCount}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₦{ebook.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No top ebooks to display yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
