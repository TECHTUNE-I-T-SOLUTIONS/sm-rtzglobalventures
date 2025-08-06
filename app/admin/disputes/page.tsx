"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  RefreshCw,
  Calendar,
  DollarSign,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import { supabase } from "@/lib/supabase"

interface Dispute {
  id: string
  order_id: string
  user_id: string
  reason: string
  description: string
  status: "open" | "investigating" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  amount: number
  admin_notes: string | null
  resolution_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  user_email: string
  user_name: string
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [resolutionNotes, setResolutionNotes] = useState("")
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
    fetchDisputes()
  }, [])

  useEffect(() => {
    filterDisputes()
  }, [disputes, searchQuery, statusFilter, priorityFilter])

  const fetchDisputes = async () => {
    try {
      const { data: disputes, error } = await supabase
        .from("disputes")
        .select(`
          *,
          profiles!disputes_user_id_fkey(email, full_name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const disputesData: Dispute[] = (disputes || []).map((dispute) => ({
        id: dispute.id,
        order_id: dispute.order_id,
        user_id: dispute.user_id,
        reason: dispute.reason,
        description: dispute.description,
        status: dispute.status as Dispute["status"],
        priority: dispute.priority as Dispute["priority"],
        amount: dispute.amount,
        admin_notes: dispute.admin_notes,
        resolution_notes: dispute.resolution_notes,
        resolved_by: dispute.resolved_by,
        resolved_at: dispute.resolved_at,
        created_at: dispute.created_at,
        updated_at: dispute.updated_at,
        user_email: dispute.profiles?.email || "",
        user_name: dispute.profiles?.full_name || "",
      }))

      setDisputes(disputesData)
    } catch (error) {
      console.error("Error fetching disputes:", error)
      toast.error("Failed to fetch disputes")
    } finally {
      setLoading(false)
    }
  }

  const filterDisputes = () => {
    let filtered = [...disputes]

    if (searchQuery) {
      filtered = filtered.filter(
        (dispute) =>
          dispute.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (dispute.user_name && dispute.user_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          dispute.reason.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((dispute) => dispute.status === statusFilter)
    }

    if (priorityFilter) {
      filtered = filtered.filter((dispute) => dispute.priority === priorityFilter)
    }

    setFilteredDisputes(filtered)
  }

  const updateDisputeStatus = async (disputeId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("disputes")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", disputeId)

      if (error) throw error

      setDisputes((prev) =>
        prev.map((dispute) =>
          dispute.id === disputeId
            ? { ...dispute, status: newStatus as Dispute["status"], updated_at: new Date().toISOString() }
            : dispute,
        ),
      )
      toast.success("Dispute status updated")
    } catch (error) {
      console.error("Error updating dispute:", error)
      toast.error("Failed to update dispute")
    }
  }

  const addAdminNotes = async (disputeId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("disputes")
        .update({
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", disputeId)

      if (error) throw error

      setDisputes((prev) =>
        prev.map((dispute) =>
          dispute.id === disputeId ? { ...dispute, admin_notes: notes, updated_at: new Date().toISOString() } : dispute,
        ),
      )
      setAdminNotes("")
      toast.success("Admin notes added")
    } catch (error) {
      console.error("Error adding notes:", error)
      toast.error("Failed to add notes")
    }
  }

  const resolveDispute = async (disputeId: string, resolutionNotes: string) => {
    try {
      const { error } = await supabase
        .from("disputes")
        .update({
          status: "resolved",
          resolution_notes: resolutionNotes,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", disputeId)

      if (error) throw error

      setDisputes((prev) =>
        prev.map((dispute) =>
          dispute.id === disputeId
            ? {
                ...dispute,
                status: "resolved" as Dispute["status"],
                resolution_notes: resolutionNotes,
                resolved_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : dispute,
        ),
      )
      setResolutionNotes("")
      toast.success("Dispute resolved")
    } catch (error) {
      console.error("Error resolving dispute:", error)
      toast.error("Failed to resolve dispute")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
      case "investigating":
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
      case "resolved":
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
      case "closed":
        return <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
      default:
        return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "investigating":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Dispute Management</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="animate-pulse">
                  <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-6 sm:h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dispute Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Handle customer disputes and refund requests</p>
        </div>
        <Button variant="outline" onClick={fetchDisputes} size={isMobile ? "sm" : "default"}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Open Disputes</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">
                  {disputes.filter((d) => d.status === "open").length}
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Investigating</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {disputes.filter((d) => d.status === "investigating").length}
                </p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {disputes.filter((d) => d.status === "resolved").length}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Disputes</p>
                <p className="text-lg sm:text-2xl font-bold">{disputes.length}</p>
              </div>
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search disputes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-black"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-black"
            >
              <option value="">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Disputes Cards */}
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Disputes ({filteredDisputes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {filteredDisputes.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">No disputes found</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {searchQuery || statusFilter || priorityFilter ? "Try adjusting your filters" : "No disputes available"}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDisputes.map((dispute, index) => (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border rounded-lg p-3 sm:p-4 bg-background flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedDispute(dispute)}
                >
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between gap-2">
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base break-words">{dispute.reason}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground break-words">
                          {dispute.user_name || "Unknown"} • {dispute.user_email}
                        </p>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-row sm:flex-col gap-1 flex-shrink-0 mt-2 sm:mt-0">
                        <Badge className={`${getPriorityColor(dispute.priority)} text-xs whitespace-nowrap`}>
                          {dispute.priority}
                        </Badge>
                        <Badge className={`${getStatusColor(dispute.status)} text-xs whitespace-nowrap`}>
                          {getStatusIcon(dispute.status)}
                          <span className="ml-1">{dispute.status}</span>
                        </Badge>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-semibold text-sm sm:text-base break-words">
                        ₦{dispute.amount.toLocaleString()}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed break-words">
                      {dispute.description}
                    </p>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{new Date(dispute.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* View Button */}
                  <Button size="sm" variant="ghost" className="w-full mt-3">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispute Details Modal */}
      <AnimatePresence>
        {selectedDispute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => setSelectedDispute(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-black rounded-lg w-full max-w-[95vw] sm:max-w-lg lg:max-w-2xl max-h-[95vh] overflow-y-auto p-3 sm:p-4 lg:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Dispute Details</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDispute(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Dispute Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Dispute ID</p>
                        <p className="font-semibold text-sm sm:text-base break-all">#{selectedDispute.id.slice(-8)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Order ID</p>
                        <p className="font-semibold text-sm sm:text-base break-all">
                          #{selectedDispute.order_id.slice(-8)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Amount</p>
                        <p className="font-semibold text-base sm:text-lg text-primary">
                          ₦{selectedDispute.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Created</p>
                        <p className="font-semibold text-sm sm:text-base break-words">
                          {new Date(selectedDispute.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getPriorityColor(selectedDispute.priority)}>{selectedDispute.priority}</Badge>
                      <Badge className={getStatusColor(selectedDispute.status)}>
                        {getStatusIcon(selectedDispute.status)}
                        <span className="ml-1">{selectedDispute.status}</span>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Customer Name</p>
                        <p className="font-semibold text-sm sm:text-base break-words">
                          {selectedDispute.user_name || "Not provided"}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Email</p>
                        <p className="font-semibold text-sm sm:text-base break-all">{selectedDispute.user_email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Dispute Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Reason</p>
                      <p className="font-semibold text-sm sm:text-base break-words">{selectedDispute.reason}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Description</p>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                        {selectedDispute.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {selectedDispute.admin_notes && (
                  <Card className="bg-card border">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Admin Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                        {selectedDispute.admin_notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {selectedDispute.resolution_notes && (
                  <Card className="bg-card border">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Resolution Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                        {selectedDispute.resolution_notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 text-sm sm:text-base">Update Status</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={selectedDispute.status === "investigating" ? "default" : "outline"}
                          onClick={() => updateDisputeStatus(selectedDispute.id, "investigating")}
                          className="text-xs sm:text-sm"
                        >
                          Investigate
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedDispute.status === "resolved" ? "default" : "outline"}
                          onClick={() => updateDisputeStatus(selectedDispute.id, "resolved")}
                          className="text-xs sm:text-sm"
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedDispute.status === "closed" ? "default" : "outline"}
                          onClick={() => updateDisputeStatus(selectedDispute.id, "closed")}
                          className="text-xs sm:text-sm"
                        >
                          Close
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-sm sm:text-base">Add Admin Notes</h4>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add internal notes about this dispute..."
                        rows={3}
                        className="mb-2 text-sm resize-none"
                      />
                      <Button
                        size="sm"
                        onClick={() => addAdminNotes(selectedDispute.id, adminNotes)}
                        disabled={!adminNotes.trim()}
                        className="text-xs sm:text-sm"
                      >
                        Add Notes
                      </Button>
                    </div>

                    {selectedDispute.status === "investigating" && (
                      <div>
                        <h4 className="font-medium mb-2 text-sm sm:text-base">Resolve Dispute</h4>
                        <Textarea
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Add resolution notes..."
                          rows={3}
                          className="mb-2 text-sm resize-none"
                        />
                        <Button
                          size="sm"
                          onClick={() => resolveDispute(selectedDispute.id, resolutionNotes)}
                          disabled={!resolutionNotes.trim()}
                          className="text-xs sm:text-sm"
                        >
                          Resolve Dispute
                        </Button>
                      </div>
                    )}
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
