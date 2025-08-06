"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  MessageSquare,
} from "lucide-react"
import { motion } from "framer-motion"
import toast from "react-hot-toast"

interface ReportData {
  salesReport: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    topProducts: Array<{
      name: string
      sales: number
      revenue: number
    }>
  }
  customerReport: {
    totalCustomers: number
    newCustomers: number
    activeCustomers: number
    customerGrowth: number
  }
  inventoryReport: {
    totalProducts: number
    lowStockProducts: number
    outOfStockProducts: number
  }
  financialReport: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
  }
  feedbackReport: {
    totalFeedback: number
    averageRating: number
    pendingFeedback: number
    resolvedFeedback: number
  }
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportData>({
    salesReport: {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      topProducts: [],
    },
    customerReport: {
      totalCustomers: 0,
      newCustomers: 0,
      activeCustomers: 0,
      customerGrowth: 0,
    },
    inventoryReport: {
      totalProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
    },
    financialReport: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
    },
    feedbackReport: {
      totalFeedback: 0,
      averageRating: 0,
      pendingFeedback: 0,
      resolvedFeedback: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30")
  const [reportType, setReportType] = useState("all")

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
    try {
      setLoading(true)

      // Fetch orders data
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          user_id,
          total_amount,
          status,
          created_at
        `)
        .gte("created_at", new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString())

      if (ordersError) throw ordersError

      // Fetch customers data
      const { data: customers, error: customersError } = await supabase
        .from("profiles")
        .select("id, created_at")
        .eq("role", "user")

      if (customersError) throw customersError

      // Fetch products data
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, price, stock_quantity")

      if (productsError) throw productsError

      // Fetch order items for top products
      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select(`
          product_id,
          quantity,
          price,
          products(name)
        `)
        .gte("created_at", new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString())

      if (orderItemsError) throw orderItemsError

      // Fetch feedback data
      const { data: feedback, error: feedbackError } = await supabase
        .from("feedback")
        .select("id, rating, status, created_at")
        .gte("created_at", new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString())

      if (feedbackError) throw feedbackError

      // Calculate sales report
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      const totalOrders = orders?.length || 0
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Calculate top products from real data
      const productSales = new Map()
      orderItems?.forEach(item => {
        const productName = (item.products as any)?.name || "Unknown Product"
        const existing = productSales.get(productName) || { sales: 0, revenue: 0 }
        productSales.set(productName, {
          sales: existing.sales + item.quantity,
          revenue: existing.revenue + (item.price * item.quantity)
        })
      })

      const topProducts = Array.from(productSales.entries())
        .map(([name, data]: [string, any]) => ({
          name,
          sales: data.sales,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Calculate customer report
      const totalCustomers = customers?.length || 0
      const newCustomers = customers?.filter(c => 
        new Date(c.created_at) >= new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
      ).length || 0
      const activeCustomers = orders?.reduce((set, order) => set.add(order.user_id), new Set()).size || 0
      const customerGrowth = totalCustomers > 0 ? ((newCustomers / totalCustomers) * 100) : 0

      // Calculate inventory report
      const totalProducts = products?.length || 0
      const lowStockProducts = products?.filter(p => p.stock_quantity < 10 && p.stock_quantity > 0).length || 0
      const outOfStockProducts = products?.filter(p => p.stock_quantity === 0).length || 0

      // Calculate financial report
      const totalExpenses = totalRevenue * 0.6 // Assuming expenses are 60% of the revenue
      const netProfit = totalRevenue - totalExpenses
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

      // Calculate feedback report
      const totalFeedback = feedback?.length || 0
      const averageRating = feedback && feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
        : 0
      const pendingFeedback = feedback?.filter(f => f.status === 'pending').length || 0
      const resolvedFeedback = feedback?.filter(f => f.status === 'resolved').length || 0

      setReports({
        salesReport: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          topProducts,
        },
        customerReport: {
          totalCustomers,
          newCustomers,
          activeCustomers,
          customerGrowth,
        },
        inventoryReport: {
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
        },
        financialReport: {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin,
        },
        feedbackReport: {
          totalFeedback,
          averageRating,
          pendingFeedback,
          resolvedFeedback,
        },
      })
    } catch (error) {
      console.error("Error fetching reports:", error)
      toast.error("Failed to fetch reports")
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (type: string) => {
    let csvContent = []
    
    switch (type) {
      case "sales":
        csvContent = [
          ["Sales Report"],
          ["Total Revenue", `₦${reports.salesReport.totalRevenue.toLocaleString()}`],
          ["Total Orders", reports.salesReport.totalOrders.toString()],
          ["Average Order Value", `₦${reports.salesReport.averageOrderValue.toLocaleString()}`],
          [],
          ["Top Products", "Sales", "Revenue"],
          ...reports.salesReport.topProducts.map(p => [p.name, p.sales.toString(), `₦${p.revenue.toLocaleString()}`])
        ]
        break
      case "customer":
        csvContent = [
          ["Customer Report"],
          ["Total Customers", reports.customerReport.totalCustomers.toString()],
          ["New Customers", reports.customerReport.newCustomers.toString()],
          ["Active Customers", reports.customerReport.activeCustomers.toString()],
          ["Customer Growth", `${reports.customerReport.customerGrowth.toFixed(1)}%`]
        ]
        break
      case "inventory":
        csvContent = [
          ["Inventory Report"],
          ["Total Products", reports.inventoryReport.totalProducts.toString()],
          ["Low Stock Products", reports.inventoryReport.lowStockProducts.toString()],
          ["Out of Stock Products", reports.inventoryReport.outOfStockProducts.toString()]
        ]
        break
      case "financial":
        csvContent = [
          ["Financial Report"],
          ["Total Revenue", `₦${reports.financialReport.totalRevenue.toLocaleString()}`],
          ["Total Expenses", `₦${reports.financialReport.totalExpenses.toLocaleString()}`],
          ["Net Profit", `₦${reports.financialReport.netProfit.toLocaleString()}`],
          ["Profit Margin", `${reports.financialReport.profitMargin.toFixed(2)}%`]
        ]
        break
      case "feedback":
        csvContent = [
          ["Feedback Report"],
          ["Total Feedback", reports.feedbackReport.totalFeedback.toString()],
          ["Average Rating", reports.feedbackReport.averageRating.toFixed(1)],
          ["Pending Feedback", reports.feedbackReport.pendingFeedback.toString()],
          ["Resolved Feedback", reports.feedbackReport.resolvedFeedback.toString()]
        ]
        break
      default:
        csvContent = [
          ["Comprehensive Report"],
          ["Sales Report"],
          ["Total Revenue", `₦${reports.salesReport.totalRevenue.toLocaleString()}`],
          ["Total Orders", reports.salesReport.totalOrders.toString()],
          [],
          ["Customer Report"],
          ["Total Customers", reports.customerReport.totalCustomers.toString()],
          ["New Customers", reports.customerReport.newCustomers.toString()],
          [],
          ["Inventory Report"],
          ["Total Products", reports.inventoryReport.totalProducts.toString()],
          ["Low Stock Products", reports.inventoryReport.lowStockProducts.toString()],
          [],
          ["Financial Report"],
          ["Total Revenue", `₦${reports.financialReport.totalRevenue.toLocaleString()}`],
          ["Net Profit", `₦${reports.financialReport.netProfit.toLocaleString()}`],
          ["Profit Margin", `${reports.financialReport.profitMargin.toFixed(2)}%`],
          [],
          ["Feedback Report"],
          ["Total Feedback", reports.feedbackReport.totalFeedback.toString()],
          ["Average Rating", reports.feedbackReport.averageRating.toFixed(1)]
        ]
    }

    const csvString = csvContent.map(row => row.join(",")).join("\n")
    const blob = new Blob([csvString], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${type}-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report exported successfully`)
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Reports</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-black text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-card border">
              <CardContent className="p-3 sm:p-4">
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reports</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Generate and export business reports</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-black text-sm"
          >
            <option value="all">All Reports</option>
            <option value="sales">Sales Report</option>
            <option value="customer">Customer Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="financial">Financial Report</option>
            <option value="feedback">Feedback Report</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-black text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline" onClick={fetchReports} size="sm" className="text-sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">₦{reports.salesReport.totalRevenue.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{reports.salesReport.totalOrders} orders</p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-lg sm:text-2xl font-bold">{reports.customerReport.totalCustomers}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <span className="text-xs sm:text-sm text-green-600">+{reports.customerReport.customerGrowth.toFixed(1)}%</span>
                </div>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-lg sm:text-2xl font-bold">{reports.inventoryReport.totalProducts}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {reports.inventoryReport.lowStockProducts} low stock
                </p>
              </div>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">₦{reports.financialReport.netProfit.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {reports.financialReport.profitMargin.toFixed(1)}% margin
                </p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Customer Feedback</p>
                <p className="text-lg sm:text-2xl font-bold">{reports.feedbackReport.totalFeedback}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {reports.feedbackReport.averageRating.toFixed(1)} avg rating
                </p>
              </div>
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales Report */}
        <Card className="bg-card border">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Sales Report</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportReport("sales")} className="text-xs">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-lg sm:text-xl font-bold">₦{reports.salesReport.totalRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Average Order</p>
                <p className="text-lg sm:text-xl font-bold">₦{reports.salesReport.averageOrderValue.toLocaleString()}</p>
              </div>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Top Products</p>
              <div className="space-y-2">
                {reports.salesReport.topProducts.slice(0, 3).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded text-xs sm:text-sm">
                    <span className="font-medium truncate">{product.name}</span>
                    <span className="text-muted-foreground">₦{product.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Report */}
        <Card className="bg-card border">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Customer Report</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportReport("customer")} className="text-xs">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-lg sm:text-xl font-bold">{reports.customerReport.totalCustomers}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">New Customers</p>
                <p className="text-lg sm:text-xl font-bold">{reports.customerReport.newCustomers}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Customers</p>
                <p className="text-lg sm:text-xl font-bold">{reports.customerReport.activeCustomers}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Growth Rate</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">+{reports.customerReport.customerGrowth.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Report */}
        <Card className="bg-card border">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Inventory Report</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportReport("inventory")} className="text-xs">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-lg sm:text-xl font-bold">{reports.inventoryReport.totalProducts}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-600">{reports.inventoryReport.lowStockProducts}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-lg sm:text-xl font-bold text-red-600">{reports.inventoryReport.outOfStockProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Report */}
        <Card className="bg-card border">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Financial Report</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportReport("financial")} className="text-xs">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-lg sm:text-xl font-bold">₦{reports.financialReport.totalRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-lg sm:text-xl font-bold">₦{reports.financialReport.totalExpenses.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">₦{reports.financialReport.netProfit.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Profit Margin</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">{reports.financialReport.profitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Report */}
        <Card className="bg-card border">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Feedback Report</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportReport("feedback")} className="text-xs">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Feedback</p>
                <p className="text-lg sm:text-xl font-bold">{reports.feedbackReport.totalFeedback}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-lg sm:text-xl font-bold">{reports.feedbackReport.averageRating.toFixed(1)}/5</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-600">{reports.feedbackReport.pendingFeedback}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">{reports.feedbackReport.resolvedFeedback}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export All Reports */}
      <Card className="bg-card border">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Export All Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Button onClick={() => exportReport("all")} className="w-full text-sm">
            <Download className="h-4 w-4 mr-2" />
            Export Comprehensive Report
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 