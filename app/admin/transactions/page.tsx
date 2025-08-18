"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { 
  Search, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  BarChart3,
  Eye,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"

interface Transaction {
  id: string
  user_id: string
  order_id: string | null
  amount: number
  currency: string
  payment_provider: string
  payment_reference: string | null
  status: "pending" | "success" | "failed" | "cancelled"
  metadata: any
  created_at: string
  updated_at: string
  user_email: string
  user_name: string
}

interface TransactionStats {
  totalRevenue: number
  totalTransactions: number
  averageTransaction: number
  monthlyGrowth: number
  successRate: number
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    monthlyGrowth: 0,
    successRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [providerFilter, setProviderFilter] = useState("")
  const [dateRange, setDateRange] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [perPage, setPerPage] = useState<number>(10)
  const [page, setPage] = useState<number>(1)

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchQuery, statusFilter, providerFilter, dateRange])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, providerFilter, dateRange])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          profiles!transactions_user_id_fkey(email, full_name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const transactionsData: Transaction[] = (data || []).map((t: any) => ({
        ...t,
        user_email: t.profiles?.email || "N/A",
        user_name: t.profiles?.full_name || "N/A",
      }))

      setTransactions(transactionsData)
      calculateStats(transactionsData)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast.error("Failed to fetch transactions")
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (transactionsData: Transaction[]) => {
    const successfulTransactions = transactionsData.filter((t) => t.status === "success")
    const totalRevenue = successfulTransactions.reduce((sum, t) => sum + t.amount, 0)
    const averageTransaction = successfulTransactions.length > 0 ? totalRevenue / successfulTransactions.length : 0
    const successRate = transactionsData.length > 0 ? (successfulTransactions.length / transactionsData.length) * 100 : 0

    const currentMonth = new Date().getMonth()
    const currentMonthRevenue = successfulTransactions
      .filter(t => new Date(t.created_at).getMonth() === currentMonth)
      .reduce((sum, t) => sum + t.amount, 0)
    const lastMonthRevenue = successfulTransactions
      .filter(t => new Date(t.created_at).getMonth() === currentMonth - 1)
      .reduce((sum, t) => sum + t.amount, 0)
    const monthlyGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

    setStats({ totalRevenue, totalTransactions: transactionsData.length, averageTransaction, monthlyGrowth, successRate })
  }

  const filterTransactions = () => {
    let filtered = [...transactions]

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          (t.payment_reference && t.payment_reference.toLowerCase().includes(lowercasedQuery)) ||
          t.user_email.toLowerCase().includes(lowercasedQuery) ||
          (t.user_name && t.user_name.toLowerCase().includes(lowercasedQuery))
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    if (providerFilter) {
      filtered = filtered.filter((t) => t.payment_provider === providerFilter)
    }

    if (dateRange) {
      const now = new Date()
      const startDate = new Date()
      switch (dateRange) {
        case "today": startDate.setHours(0, 0, 0, 0); break
        case "week": startDate.setDate(now.getDate() - 7); break
        case "month": startDate.setMonth(now.getMonth() - 1); break
        case "quarter": startDate.setMonth(now.getMonth() - 3); break
        case "year": startDate.setFullYear(now.getFullYear() - 1); break
      }
      if (dateRange !== "all") {
        filtered = filtered.filter((t) => new Date(t.created_at) >= startDate)
      }
    }

    setFilteredTransactions(filtered)
  }

  const exportTransactions = () => {
    const csvContent = [
      ["Reference", "Provider", "Amount", "Status", "Customer", "Date"],
      ...filteredTransactions.map((t) => [t.payment_reference || t.id.slice(-8), t.payment_provider, t.amount.toString(), t.status, t.user_email, new Date(t.created_at).toLocaleDateString()]),
    ].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success("Transactions exported!")
  }

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success": return "success"
      case "pending": return "default"
      case "failed":
      case "cancelled": return "secondary"
      default: return "default"
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case "paystack": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "opay": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / perPage))
  const start = (page - 1) * perPage
  const end = start + perPage
  const paginatedTransactions = filteredTransactions.slice(start, end)

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-card border animate-pulse"><CardContent className="p-6"><div className="h-4 bg-muted rounded w-3//4 mb-2"></div><div className="h-8 bg-muted rounded w-1/2"></div></CardContent></Card>
          ))}
        </div>
        <div className="h-20 bg-card border rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-card border animate-pulse h-64"></Card>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">Monitor all financial transactions and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportTransactions}><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={DollarSign} title="Total Revenue" value={`₦${stats.totalRevenue.toLocaleString()}`} color="text-green-500" />
        <StatCard icon={CreditCard} title="Transactions" value={stats.totalTransactions} />
        <StatCard icon={BarChart3} title="Avg. Transaction" value={`₦${Math.round(stats.averageTransaction).toLocaleString()}`} color="text-blue-500" />
        <StatCard icon={stats.monthlyGrowth >= 0 ? TrendingUp : TrendingDown} title="Monthly Growth" value={`${stats.monthlyGrowth.toFixed(1)}%`} color={stats.monthlyGrowth >= 0 ? "text-green-500" : "text-red-500"} />
        <StatCard icon={CheckCircle} title="Success Rate" value={`${stats.successRate.toFixed(1)}%`} color="text-green-500" />
      </div>

      {/* Filters */}
      <Card className="bg-card border">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input placeholder="Search by Ref, Email, Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-background" />
            <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-black">
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select aria-label="Filter by provider" value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-black">
              <option value="">All Providers</option>
              <option value="paystack">Paystack</option>
              <option value="opay">OPay</option>
            </select>
            <select aria-label="Filter by date range" value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-black">
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Grid */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Showing {filteredTransactions.length === 0 ? 0 : start + 1}-{Math.min(end, filteredTransactions.length)} of {filteredTransactions.length}</div>
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
          {paginatedTransactions.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="bg-card border h-full flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">₦{t.amount.toLocaleString()}</CardTitle>
                    <p className={`text-xs font-medium ${getProviderColor(t.payment_provider)} px-2 py-1 rounded-full inline-block`}>{t.payment_provider}</p>
                  </div>
                  <Badge variant={getStatusVariant(t.status) as any}>{t.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-3 flex-grow">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t.user_name}</p>
                      <p className="text-xs text-muted-foreground">{t.user_email}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{t.payment_reference || t.id}</div>
                </CardContent>
                <div className="p-4 border-t flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedTransaction(t)}><Eye className="h-4 w-4 mr-2" />Details</Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTransaction(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-black rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                <h2 className="text-xl sm:text-2xl font-bold">Transaction Details</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedTransaction(null)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <InfoCard
                  title="Transaction Info"
                  data={[
                    { label: 'Transaction ID', value: selectedTransaction.id },
                    { label: 'Payment Reference', value: selectedTransaction.payment_reference },
                    {
                      label: 'Amount',
                      value: `₦${selectedTransaction.amount.toLocaleString()} ${selectedTransaction.currency}`,
                    },
                    {
                      label: 'Provider',
                      value: selectedTransaction.payment_provider,
                      capitalize: true,
                    },
                  ]}
                />

                <InfoCard
                  title="Status"
                  data={[
                    {
                      label: 'Status',
                      value: (
                        <Badge
                          className="whitespace-nowrap"
                          variant={getStatusVariant(selectedTransaction.status) as any}
                        >
                          {selectedTransaction.status}
                        </Badge>
                      ),
                    },
                  ]}
                />

                <InfoCard
                  title="Customer"
                  data={[
                    { label: 'Name', value: selectedTransaction.user_name },
                    { label: 'Email', value: selectedTransaction.user_email },
                    {
                      label: 'Order ID',
                      value: selectedTransaction.order_id
                        ? `#${selectedTransaction.order_id.slice(-8)}`
                        : 'N/A',
                    },
                    {
                      label: 'Date',
                      value: new Date(selectedTransaction.created_at).toLocaleString(),
                    },
                  ]}
                />

                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted rounded-lg overflow-x-auto p-4">
                      <pre className="text-xs whitespace-pre-wrap break-words">
                        {JSON.stringify(selectedTransaction.metadata, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

const StatCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: string | number, color?: string }) => (
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
          <p className="text-muted-foreground whitespace-nowrap">{item.label}</p>
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
