"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { 
  Search, 
  Package, 
  Calendar, 
  DollarSign, 
  Truck, 
  Eye, 
  RefreshCw,
  Filter,
  SortAsc,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
  CreditCard,
  Download,
  Share2,
  MessageCircle,
  Star,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import toast from "react-hot-toast"

interface Order {
  id: string
  total_amount: number
  status: string
  payment_status: string
  payment_reference?: string
  payment_provider?: string
  shipping_address: any
  created_at: string
  updated_at: string
  order_items: {
    id: string
    quantity: number
    price: number
    products: {
      id: string
      name: string
      image_url: string
      category: string
    }
  }[]
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [disputeModalOpen, setDisputeModalOpen] = useState(false)
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState<Order | null>(null)

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  useEffect(() => {
    filterAndSortOrders()
  }, [orders, searchQuery, statusFilter, paymentFilter, sortBy])

  const fetchOrders = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            products (
              id,
              name,
              image_url,
              category
            )
          )
        `)
        .eq("user_id", user.id)
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

  const filterAndSortOrders = () => {
    let filtered = orders

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.payment_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.order_items.some((item) => item.products.name.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Filter by payment status
    if (paymentFilter !== "all") {
      filtered = filtered.filter((order) => order.payment_status === paymentFilter)
    }

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "amount_high":
          return b.total_amount - a.total_amount
        case "amount_low":
          return a.total_amount - b.total_amount
        default:
          return 0
      }
    })

    setFilteredOrders(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    )
  }

  const stats = {
    total: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + order.total_amount, 0),
    delivered: orders.filter((order) => order.status === "delivered").length,
    pending: orders.filter((order) => order.status === "pending").length,
    processing: orders.filter((order) => order.status === "processing").length,
    shipped: orders.filter((order) => order.status === "shipped").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
    paid: orders.filter((order) => order.payment_status === "paid").length,
    pendingPayment: orders.filter((order) => order.payment_status === "pending").length,
    failedPayment: orders.filter((order) => order.payment_status === "failed").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-card border">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-card border">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-500" />
                My Orders
              </h1>
              <p className="text-muted-foreground mt-2">
                Track and manage your order history
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {filteredOrders.length} orders
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchOrders}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { label: "Total Orders", value: stats.total, icon: Package, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
              { label: "Total Spent", value: `₦${stats.totalSpent.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
              { label: "Delivered", value: stats.delivered, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
              { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950" },
              { label: "Paid", value: stats.paid, icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`${stat.bg} border-0 shadow-sm hover:shadow-md transition-shadow`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Processing", value: stats.processing, icon: Package, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
              { label: "Shipped", value: stats.shipped, icon: Truck, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
              { label: "Cancelled", value: stats.cancelled, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: (index + 5) * 0.1 }}
              >
                <Card className={`${stat.bg} border-0 shadow-sm hover:shadow-md transition-shadow`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Filters and Search */}
          <Card className="bg-card border overflow-x-hidden shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Search Bar */}
                <div className="relative w-full lg:flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders by ID, payment reference, or product name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full text-sm"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto">
                  {/* Status Filter */}
                  <div className="relative w-full sm:w-auto">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-10 pr-8 py-2 w-full sm:w-auto border rounded-md bg-white dark:bg-black text-sm appearance-none"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Payment Filter */}
                  <div className="relative w-full sm:w-auto">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="pl-10 pr-8 py-2 w-full sm:w-auto border rounded-md bg-white dark:bg-black text-sm appearance-none"
                    >
                      <option value="all">All Payments</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending Payment</option>
                      <option value="failed">Failed Payment</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="relative w-full sm:w-auto">
                    <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="pl-10 pr-8 py-2 w-full sm:w-auto border rounded-md bg-white dark:bg-black text-sm appearance-none"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="amount_high">Amount: High to Low</option>
                      <option value="amount_low">Amount: Low to High</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedOrders.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">{selectedOrders.length} orders selected</span>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" /> Export Selected
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" /> Share Orders
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <Card className="bg-card border shadow-sm">
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchQuery || statusFilter !== "all" || paymentFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "You haven't placed any orders yet. Start shopping to see your order history here!"}
                </p>
                <Link href="/products">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Package className="h-4 w-4 mr-2" />
                    Start Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {/* Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => toggleOrderSelection(order.id)}
                            className="w-4 h-4 text-primary bg-background border-gray-300 rounded focus:ring-primary mt-1"
                          />
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              Order #{order.id.slice(-8)}
                              {order.payment_reference && (
                                <Badge variant="outline" className="text-xs">
                                  Ref: {order.payment_reference.slice(-8)}
                                </Badge>
                              )}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(order.created_at).toLocaleDateString()}
                              </div>
                              {order.shipping_address && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {order.shipping_address.city || "Address"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap sm:flex-nowrap items-start gap-2 sm:gap-3 w-full sm:w-auto">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </Badge>

                          <Badge className={getPaymentStatusColor(order.payment_status)}>
                            <CreditCard className="h-3 w-3 mr-1" />
                            {order.payment_status}
                          </Badge>

                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap"
                            onClick={() => {
                              setSelectedOrderForDispute(order);
                              setDisputeModalOpen(true);
                            }}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Create Dispute
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Order Items */}
                        <div className="space-y-3">
                          {order.order_items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                {item.products.image_url ? (
                                  <img
                                    src={item.products.image_url || "/placeholder.svg"}
                                    alt={item.products.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{item.products.name}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>Qty: {item.quantity} × ₦{item.price.toLocaleString()}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {item.products.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                          {order.order_items.length > 3 && (
                            <p className="text-sm text-muted-foreground">+{order.order_items.length - 3} more items</p>
                          )}
                        </div>

                        {/* Order Summary */}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{order.order_items.length} items</span>
                            {order.payment_provider && (
                              <span>via {order.payment_provider}</span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-muted-foreground">Total Amount:</span>
                            <div className="text-xl font-bold text-primary">₦{order.total_amount.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                          <Link href={`./orders/${order.id}`}>
                            <Button size="sm" className="text-xs sm:text-sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Dispute Modal */}
      <AnimatePresence>
        {disputeModalOpen && selectedOrderForDispute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setDisputeModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white shadow-lg dark:shadow-black/30 dark:bg-black rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create Dispute</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDisputeModalOpen(false)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const reason = formData.get("reason") as string
                  const description = formData.get("description") as string
                  const priority = formData.get("priority") as string

                  if (!reason || !description || !priority) {
                    toast.error("Please fill out all fields.")
                    return
                  }

                  try {
                    const { error } = await supabase.from("disputes").insert([
                      {
                        order_id: selectedOrderForDispute.id,
                        user_id: user?.id,
                        reason,
                        description,
                        priority,
                        amount: selectedOrderForDispute.total_amount,
                      },
                    ])

                    if (error) throw error

                    toast.success("Dispute created successfully")
                    setDisputeModalOpen(false)
                  } catch (error) {
                    console.error("Error creating dispute:", error)
                    toast.error("Failed to create dispute")
                  }
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-muted-foreground mb-1">Reason</label>
                    <Input id="reason" name="reason" placeholder="e.g., Item not received" required />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                      placeholder="Provide a detailed description of the issue..."
                      required
                    ></textarea>
                  </div>
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-muted-foreground mb-1">Priority</label>
                    <Select name="priority" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDisputeModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Submit Dispute</Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
