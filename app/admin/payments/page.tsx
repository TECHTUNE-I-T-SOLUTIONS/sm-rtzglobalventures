'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import {
  Search,
  Download,
  Eye,
  RefreshCw,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface Payment {
  id: string
  order_id: string
  amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed'
  payment_method?: string
  reference: string
  created_at: string
  updated_at: string
  user_email: string
  user_name: string
}

interface PaymentStats {
  totalRevenue: number
  totalTransactions: number
  successfulPayments: number
  failedPayments: number
  pendingPayments: number
  deliveredOrders: number
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
    deliveredOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [perPage, setPerPage] = useState<number>(10)
  const [page, setPage] = useState<number>(1)

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, searchQuery, statusFilter, paymentStatusFilter, dateFilter])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, paymentStatusFilter, dateFilter])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          total_amount,
          status,
          payment_status,
          payment_reference,
          payment_method,
          created_at,
          updated_at,
          profiles!orders_user_id_fkey(email, full_name)
        `,
        )
        .order('created_at', { ascending: false })

      if (error) throw error

      const paymentsData: Payment[] = (orders || []).map((order: any) => ({
        id: order.id,
        order_id: order.id,
        amount: order.total_amount,
        status: order.status as Payment['status'],
        payment_status: order.payment_status as Payment['payment_status'],
        payment_method:
          order.payment_method || (order.payment_reference ? 'online' : 'pending'),
        reference: order.payment_reference || `ORD-${order.id.slice(-8)}`,
        created_at: order.created_at,
        updated_at: order.updated_at,
        user_email: order.profiles?.email || 'N/A',
        user_name: order.profiles?.full_name || 'N/A',
      }))

      setPayments(paymentsData)
      calculateStats(paymentsData)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (paymentsData: Payment[]) => {
    const stats = paymentsData.reduce(
      (
        acc,
        payment,
      ) => {
        acc.totalTransactions++

        if (payment.payment_status === 'paid') {
          acc.totalRevenue += payment.amount
          acc.successfulPayments++
        } else if (payment.payment_status === 'failed') {
          acc.failedPayments++
        } else if (payment.payment_status === 'pending') {
          acc.pendingPayments++
        }

        if (payment.status === 'delivered') {
          acc.deliveredOrders++
        }

        return acc
      },
      {
        totalRevenue: 0,
        totalTransactions: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0,
        deliveredOrders: 0,
      },
    )
    setStats(stats)
  }

  const filterPayments = () => {
    let filtered = [...payments]

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (payment) =>
          payment.reference.toLowerCase().includes(lowercasedQuery) ||
          payment.user_email.toLowerCase().includes(lowercasedQuery) ||
          payment.user_name.toLowerCase().includes(lowercasedQuery),
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((payment) => payment.status === statusFilter)
    }

    if (paymentStatusFilter) {
      filtered = filtered.filter(
        (payment) => payment.payment_status === paymentStatusFilter,
      )
    }

    if (dateFilter) {
      const today = new Date()
      const filterDate = new Date(today)

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(today.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(today.getMonth() - 1)
          break
      }
      if (dateFilter !== 'all') {
        filtered = filtered.filter(
          (payment) => new Date(payment.created_at) >= filterDate,
        )
      }
    }

    setFilteredPayments(filtered)
  }

  const pageCount = Math.max(1, Math.ceil(filteredPayments.length / perPage))
  const start = (page - 1) * perPage
  const end = start + perPage
  const paginatedPayments = filteredPayments.slice(start, end)

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'delivered':
        return 'success'
      case 'pending':
      case 'processing':
        return 'warning'
      case 'shipped':
        return 'info'
      case 'failed':
      case 'cancelled':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const handleUpdatePaymentStatus = async (paymentId: string, newStatus: 'paid') => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', paymentId)
        .select()
        .single()

      if (error) throw error

      toast.success('Payment status updated successfully')
      setPayments((prevPayments) =>
        prevPayments.map((p) => (p.id === paymentId ? { ...p, ...data } : p)),
      )
      setSelectedPayment(null)
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error('Failed to update payment status')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-20 bg-card border rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card
              key={i}
              className="bg-card border animate-pulse h-64"
            ></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage all payment transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchPayments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => toast('Export functionality coming soon!')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`₦${stats.totalRevenue.toLocaleString()}`}
          color="text-green-500"
        />
        <StatCard
          icon={CreditCard}
          title="Transactions"
          value={stats.totalTransactions}
        />
        <StatCard
          icon={TrendingUp}
          title="Success Rate"
          value={`${
            stats.totalTransactions > 0
              ? Math.round(
                  (stats.successfulPayments / stats.totalTransactions) * 100,
                )
              : 0
          }%`}
          color="text-green-500"
        />
        <StatCard
          icon={CheckCircle}
          title="Delivered Orders"
          value={stats.deliveredOrders}
          color="text-blue-500"
        />
      </div>

      {/* Filters */}
      <Card className="bg-card border">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Search by Ref, Email, Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background"
            />
            <select
              aria-label="Filter by order status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-black"
            >
              <option value="">All Order Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              aria-label="Filter by payment status"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-black"
            >
              <option value="">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
            <select
              aria-label="Filter by date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-black"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Grid */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Showing {filteredPayments.length === 0 ? 0 : start + 1}-{Math.min(end, filteredPayments.length)} of {filteredPayments.length}</div>
        <div className="flex items-center gap-2">
          <select aria-label="Items per page" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }} className="px-2 py-1 border rounded bg-white dark:bg-black text-sm">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={40}>40</option>
          </select>
          <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
          <Button size="sm" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {paginatedPayments.map((payment) => (
            <motion.div
              key={payment.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="bg-card border h-full flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      ₦{payment.amount.toLocaleString()}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-mono">
                      {payment.reference}
                    </p>
                  </div>
                  <Badge className={getStatusVariant(payment.payment_status)}>
                    {payment.payment_status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 flex-grow">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{payment.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.user_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Order Status</span>
                    <Badge className={getStatusVariant(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
                <div className="p-4 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <Eye className="h-4 w-4 mr-2" /> View Details
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Payment Details Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPayment(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white shadow-lg dark:shadow-black/30 dark:bg-black rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                <h2 className="text-xl sm:text-2xl font-bold">Payment Details</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedPayment(null)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <InfoCard
                  title="Transaction Info"
                  data={[
                    { label: 'Reference', value: selectedPayment.reference },
                    { label: 'Order ID', value: selectedPayment.order_id.slice(-8) },
                    { label: 'Amount', value: `₦${selectedPayment.amount.toLocaleString()}` },
                    { label: 'Payment Method', value: selectedPayment.payment_method, capitalize: true },
                  ]}
                />

                <InfoCard
                  title="Status"
                  data={[
                    {
                      label: 'Order Status',
                      value: (
                        <Badge className={`whitespace-nowrap ${getStatusVariant(selectedPayment.status)}`}>
                          {selectedPayment.status}
                        </Badge>
                      ),
                    },
                    {
                      label: 'Payment Status',
                      value: (
                        <Badge
                          className="whitespace-nowrap"
                          // @ts-ignore
                          variant={getStatusVariant(selectedPayment.payment_status)}
                        >
                          {selectedPayment.payment_status}
                        </Badge>
                      ),
                    },
                  ]}
                />

                <InfoCard
                  title="Customer"
                  data={[
                    { label: 'Name', value: selectedPayment.user_name },
                    { label: 'Email', value: selectedPayment.user_email },
                    { label: 'Created At', value: new Date(selectedPayment.created_at).toLocaleString() },
                    { label: 'Last Updated', value: new Date(selectedPayment.updated_at).toLocaleString() },
                  ]}
                />
              </div>

              {selectedPayment.payment_status === 'pending' && (
                <div className="mt-6">
                  <Button className="w-full" onClick={() => handleUpdatePaymentStatus(selectedPayment.id, 'paid')}>
                    <CheckCircle className="h-4 w-4 mr-2" /> Mark as Paid
                  </Button>
                </div>
              )}
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
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium text-muted-foreground`}>{title}</p>
          <p className={`text-2xl font-bold ${color || ''}`}>{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${color || 'text-primary'}`} />
      </div>
    </CardContent>
  </Card>
)

const InfoCard = ({
  title,
  data,
}: {
  title: string
  data: { label: string; value: any; capitalize?: boolean }[]
}) => (
  <Card className="bg-card border">
    <CardHeader>
      <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm">
      {data.map((item) => (
        <div
          key={item.label}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2"
        >
          <p className="text-muted-foreground whitespace-nowrap text-sm">{item.label}</p>
          <div
            className={`font-semibold break-words sm:text-right text-left w-full ${
              item.capitalize ? 'capitalize' : ''
            }`}
          >
            {item.value}
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
)
