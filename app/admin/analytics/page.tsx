"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Download,
  RefreshCw,
} from "lucide-react"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  revenueGrowth: number
  orderGrowth: number
  customerGrowth: number
  averageOrderValue: number
  topProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
  }>
  recentOrders: Array<{
    id: string
    customer_name: string
    amount: number
    status: string
    created_at: string
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
    orders: number
  }>
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    customerGrowth: 0,
    averageOrderValue: 0,
    topProducts: [],
    recentOrders: [],
    monthlyRevenue: [],
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30")

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const days = parseInt(dateRange)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          total_amount,
          status,
          created_at,
          profiles!orders_user_id_fkey(full_name)
        `)
        .gte("created_at", startDate.toISOString())

      if (ordersError) throw ordersError

      const { data: customers, error: customersError } = await supabase
        .from("profiles")
        .select("id, created_at")
        .eq("role", "user")

      if (customersError) throw customersError

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id")

      if (productsError) throw productsError
        
      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select(`
            product_id,
            quantity,
            price,
            products(name)
        `)
        .gte("created_at", startDate.toISOString())

      if (orderItemsError) throw orderItemsError

      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      const totalOrders = orders?.length || 0
      const totalCustomers = customers?.length || 0
      const totalProducts = products?.length || 0
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      const productSales = new Map()
      orderItems?.forEach(item => {
        const productName = (item.products as any)?.name || "Unknown Product"
        const existing = productSales.get(productName) || { sales: 0, revenue: 0, id: item.product_id }
        productSales.set(productName, {
          id: existing.id,
          sales: existing.sales + item.quantity,
          revenue: existing.revenue + (item.price * item.quantity)
        })
      })

      const topProducts = Array.from(productSales.entries())
        .map(([name, data]: [string, any]) => ({
          id: data.id,
          name,
          sales: data.sales,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      const monthlyRevenueMap = new Map<string, { revenue: number, orders: number }>()
      orders?.forEach(order => {
        const month = new Date(order.created_at).toLocaleString('default', { month: 'short' })
        const existing = monthlyRevenueMap.get(month) || { revenue: 0, orders: 0 }
        monthlyRevenueMap.set(month, {
          revenue: existing.revenue + order.total_amount,
          orders: existing.orders + 1
        })
      })
        
      const monthlyRevenue = Array.from(monthlyRevenueMap.entries()).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        orders: data.orders
      }))

      const recentOrders = orders?.slice(0, 5).map(order => ({
        id: order.id,
        customer_name: Array.isArray(order.profiles) && order.profiles.length > 0
          ? order.profiles[0].full_name
          : "Unknown",
        amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
      })) || []

      setAnalytics({
 totalRevenue: totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        revenueGrowth: 12.5,
        orderGrowth: 8.3,
        customerGrowth: 15.2,
        averageOrderValue,
        topProducts,
 recentOrders: recentOrders,
        monthlyRevenue,
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast.error("Failed to fetch analytics")
    } finally {
      setLoading(false)
    }
  }

  const exportAnalytics = () => {
    const csvContent = [
      ["Metric", "Value", "Growth"],
      ["Total Revenue", `₦${analytics.totalRevenue.toLocaleString()}`, `${analytics.revenueGrowth}%`],
      ["Total Orders", analytics.totalOrders.toString(), `${analytics.orderGrowth}%`],
      ["Total Customers", analytics.totalCustomers.toString(), `${analytics.customerGrowth}%`],
      ["Average Order Value", `₦${analytics.averageOrderValue.toLocaleString()}`, ""],
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Analytics exported successfully")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-black"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border">
              <CardContent className="p-4 sm:p-6">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
        {/* Title + Subtitle */}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground break-words">
            Monitor your business performance and insights
          </p>
        </div>

        {/* Controls: dropdown and buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-black w-full sm:w-auto text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <Button
            variant="outline"
            onClick={fetchAnalytics}
            className="w-full sm:w-auto text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={exportAnalytics}
            className="w-full sm:w-auto text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>


      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-card border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₦{analytics.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {analytics.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${analytics.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {analytics.revenueGrowth >= 0 ? "+" : ""}{analytics.revenueGrowth}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                <div className="flex items-center gap-1 mt-1">
                  {analytics.orderGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${analytics.orderGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {analytics.orderGrowth >= 0 ? "+" : ""}{analytics.orderGrowth}%
                  </span>
                </div>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{analytics.totalCustomers}</p>
                <div className="flex items-center gap-1 mt-1">
                  {analytics.customerGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${analytics.customerGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {analytics.customerGrowth >= 0 ? "+" : ""}{analytics.customerGrowth}%
                  </span>
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">₦{analytics.averageOrderValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">Per order</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sales} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦{product.revenue.toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦{order.amount.toLocaleString()}</p>
                    <Badge variant="outline" className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
              <Bar dataKey="orders" fill="#82ca9d" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
} 