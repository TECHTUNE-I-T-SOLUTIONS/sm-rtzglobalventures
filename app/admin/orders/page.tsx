"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Search, Eye, Package, Truck, CheckCircle, XCircle, Calendar, DollarSign, User, Copy } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Order {
  id: string
  user_id: string
  total_amount: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  payment_status: "pending" | "paid" | "failed"
  payment_reference: string
  shipping_address: any
  created_at: string
  profiles: {
    full_name: string | null
    email: string
    phone: string | null
  }
  order_items: Array<{
    id: string
    quantity: number
    price: number
    products: {
      name: string
      category: string
    }
  }>
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchQuery, statusFilter])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          profiles!orders_user_id_fkey(full_name, email, phone),
          order_items(
            *,
            products(name, category)
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Failed to fetch orders")
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(lowercasedQuery) ||
          (order.payment_reference && order.payment_reference.toLowerCase().includes(lowercasedQuery)) ||
          order.profiles.email.toLowerCase().includes(lowercasedQuery) ||
          (order.profiles.full_name && order.profiles.full_name.toLowerCase().includes(lowercasedQuery)),
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

      if (error) throw error

      const order = orders.find((o) => o.id === orderId)
      if (order) {
        await supabase.from("notifications").insert([
          {
            user_id: order.user_id,
            title: "Order Status Updated",
            message: `Your order #${orderId.slice(-6)} has been updated to ${newStatus}`,
            type: "info",
          },
        ])
      }

      toast.success(`Order status updated to ${newStatus}`)
      fetchOrders()
    } catch (error: any) {
      console.error("Error updating order status:", error)
      toast.error(error.message || "Failed to update order status")
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "delivered":
        return "success"
      case "pending":
      case "processing":
        return "warning"
      case "shipped":
        return "info"
      case "failed":
      case "cancelled":
        return "destructive"
      default:
        return "default"
    }
  }

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    totalRevenue: orders.reduce((sum, order) => (order.payment_status === "paid" ? sum + order.total_amount : sum), 0),
  }

  const renderShippingAddress = (address: any) => {
    if (typeof address === "string") {
      try {
        const parsed = JSON.parse(address)
        return `${parsed.address}, ${parsed.city}, ${parsed.state}`
      } catch (e) {
        return address
      }
    }
    if (typeof address === "object" && address !== null) {
      return `${address.address}, ${address.city}, ${address.state}`
    }
    return "Not available"
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Order Management</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-card border animate-pulse">
              <CardContent className="p-3 sm:p-4">
                <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 sm:h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-16 sm:h-20 bg-card border rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-card border animate-pulse h-48 sm:h-64"></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Order Management</h1>
        <Badge variant="secondary" className="text-xs sm:text-sm">
          {filteredOrders.length} orders found
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard icon={Package} title="Total Orders" value={stats.total} />
        <StatCard icon={Calendar} title="Pending" value={stats.pending} color="text-gray-500" />
        <StatCard icon={Package} title="Processing" value={stats.processing} color="text-yellow-500" />
        <StatCard icon={Truck} title="Shipped" value={stats.shipped} color="text-blue-500" />
        <StatCard icon={CheckCircle} title="Delivered" value={stats.delivered} color="text-green-500" />
        <StatCard
          icon={DollarSign}
          title="Revenue"
          value={`₦${stats.totalRevenue.toLocaleString()}`}
          color="text-primary"
        />
      </div>

      {/* Filters */}
      <div className="w-full max-w-full sm:max-w-2xl mx-auto sm:mx-0">
        <Card className="bg-card border overflow-x-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              {/* Search Input */}
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by Order ID, Ref, Email, or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background text-sm w-full text-xs sm:text-sm"
                />
              </div>

              {/* Status Filter Dropdown */}
              <div className="w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-lg bg-white dark:bg-black"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <AnimatePresence>
          {filteredOrders.map((order) => (
            <motion.div key={order.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="bg-card border h-full flex flex-col">
                <CardHeader className="flex-row items-center justify-between p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Order #{order.id.slice(-6)}</CardTitle>
                  <Badge variant={getStatusVariant(order.status) as any} className="text-xs">
                    {order.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 flex-grow p-3 sm:p-6 pt-0">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm sm:text-base truncate">{order.profiles.full_name || "N/A"}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{order.profiles.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-primary">₦{order.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Payment</span>
                    <Badge variant={getStatusVariant(order.payment_status) as any} className="text-xs">
                      {order.payment_status}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Items: {order.order_items.length}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.order_items.map((i) => i.products.name).join(", ")}
                    </p>
                  </div>
                </CardContent>
                <div className="p-3 sm:p-4 border-t flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedOrder(order)}
                      className="text-xs sm:text-sm"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="text-xs sm:text-sm bg-transparent">
                          Update Status
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white dark:bg-black w-48">
                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "pending")}>
                          Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "processing")}>
                          Processing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "shipped")}>
                          Shipped
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "delivered")}>
                          Delivered
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          className="text-red-500"
                        >
                          Cancelled
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-black rounded-lg p-3 sm:p-4 lg:p-6 w-full max-w-[95vw] sm:max-w-4xl max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold">Order Details #{selectedOrder.id.slice(-8)}</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
                <Card className="bg-card border overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm break-words">
                    <InfoRow label="Order ID" value={selectedOrder.id} copyable />
                    <InfoRow label="Payment Reference" 
                    value={selectedOrder.payment_reference} copyable />
                    <InfoRow label="Total Amount" value={`₦${selectedOrder.total_amount.toLocaleString()}`} />
                    <InfoRow label="Order Date" value={new Date(selectedOrder.created_at).toLocaleString()} />
                    <InfoRow label="Shipping Address" value={renderShippingAddress(selectedOrder.shipping_address)} />
                  </CardContent>
                </Card>

                <Card className="bg-card border overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm break-words">
                    <InfoRow label="Name" value={selectedOrder.profiles.full_name || "N/A"} />
                    <InfoRow label="Email" value={selectedOrder.profiles.email} />
                    <InfoRow label="Phone" value={selectedOrder.profiles.phone || "N/A"} />
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border mt-4 sm:mt-6">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Order Items ({selectedOrder.order_items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-background"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base truncate">{item.products.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Category: {item.products.category}</p>
                        </div>
                        <div className="text-right ml-3">
                          <p className="font-semibold text-sm sm:text-base">₦{item.price.toLocaleString()}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const StatCard = ({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: React.ElementType
  title: string
  value: string | number
  color?: string
}) => (
  <Card className="bg-card border">
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-medium text-muted-foreground`}>{title}</p>
          <p className={`text-lg sm:text-xl font-bold ${color || ""}`}>{value}</p>
        </div>
        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color || "text-primary"}`} />
      </div>
    </CardContent>
  </Card>
)

const InfoRow = ({
  label,
  value,
  copyable = false,
}: {
  label: string
  value: string | null
  copyable?: boolean
}) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 w-full">
    {/* Label */}
    <p className="font-medium text-muted-foreground whitespace-nowrap">{label}</p>

    {/* Value + Copy */}
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-1 break-words w-full text-left">
      <p className="font-semibold break-words w-full">{value || "N/A"}</p>
      {copyable && value && (
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5 flex-shrink-0"
          onClick={() => {
            navigator.clipboard.writeText(value)
            toast.success("Copied!")
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}
    </div>
  </div>
)

