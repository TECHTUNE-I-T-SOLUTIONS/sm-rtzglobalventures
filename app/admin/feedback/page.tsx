"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import {
  MessageSquare,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Reply,
  Filter,
  RefreshCw,
} from "lucide-react"
import toast from "react-hot-toast"

interface Feedback {
  id: string
  user_id: string
  rating: number
  message: string
  category: string
  status: string
  admin_response: string | null
  created_at: string
  profiles: {
    full_name: string
    email: string
  }
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [response, setResponse] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    fetchFeedback()
  }, [statusFilter, categoryFilter])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from("feedback")
        .select(`
          *,
          profiles(full_name, email)
        `)
        .order("created_at", { ascending: false })

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setFeedback(data || [])
    } catch (error) {
      console.error("Error fetching feedback:", error)
      toast.error("Failed to fetch feedback")
    } finally {
      setLoading(false)
    }
  }

  const updateFeedbackStatus = async (feedbackId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("feedback")
        .update({ status })
        .eq("id", feedbackId)

      if (error) throw error

      toast.success("Feedback status updated")
      fetchFeedback()
    } catch (error) {
      console.error("Error updating feedback:", error)
      toast.error("Failed to update feedback")
    }
  }

  const submitResponse = async () => {
    if (!selectedFeedback || !response.trim()) return

    try {
      const { error } = await supabase
        .from("feedback")
        .update({ 
          admin_response: response,
          status: "resolved"
        })
        .eq("id", selectedFeedback.id)

      if (error) throw error

      toast.success("Response submitted successfully")
      setSelectedFeedback(null)
      setResponse("")
      fetchFeedback()
    } catch (error) {
      console.error("Error submitting response:", error)
      toast.error("Failed to submit response")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "reviewed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "product":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "service":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "website":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "support":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Customer Feedback</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-card border">
              <CardContent className="p-4 sm:p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-muted rounded"></div>
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
          <h1 className="text-2xl sm:text-3xl font-bold">Customer Feedback</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage and respond to customer feedback</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-black text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-black text-sm"
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="product">Product</option>
            <option value="service">Service</option>
            <option value="website">Website</option>
            <option value="support">Support</option>
          </select>
          <Button variant="outline" onClick={fetchFeedback} size="sm" className="text-sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Feedback Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-lg sm:text-2xl font-bold">{feedback.length}</p>
              </div>
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {feedback.filter(f => f.status === "pending").length}
                </p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Reviewed</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">
                  {feedback.filter(f => f.status === "reviewed").length}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {feedback.filter(f => f.status === "resolved").length}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {feedback.map((item) => (
          <Card key={item.id} className="bg-card border">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 sm:h-4 sm:w-4 ${
                          i < item.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                    {item.status}
                  </Badge>
                </div>
                <Badge className={`text-xs ${getCategoryColor(item.category)}`}>
                  {item.category}
                </Badge>
              </div>
              <div>
                <p className="font-medium text-sm sm:text-base truncate">
                  {item.profiles?.full_name || "Anonymous"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.profiles?.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Message:</p>
                <p className="text-xs sm:text-sm break-words">{item.message || "No message provided"}</p>
              </div>

              {item.admin_response && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">Admin Response:</p>
                  <p className="text-xs sm:text-sm bg-muted p-2 rounded break-words">{item.admin_response}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                {item.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateFeedbackStatus(item.id, "reviewed")}
                      className="text-xs"
                    >
                      Mark Reviewed
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setSelectedFeedback(item)}
                      className="text-xs"
                    >
                      <Reply className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Respond
                    </Button>
                  </>
                )}
                {item.status === "reviewed" && (
                  <Button
                    size="sm"
                    onClick={() => setSelectedFeedback(item)}
                    className="text-xs"
                  >
                    <Reply className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Respond
                  </Button>
                )}
                {item.status === "resolved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFeedback(item)}
                    className="text-xs"
                  >
                    <Reply className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Add Response
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Response Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-lg p-4 sm:p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Respond to Feedback</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Customer Message:</p>
                <p className="text-sm bg-muted p-2 rounded break-words">{selectedFeedback.message}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Your Response:</p>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Enter your response..."
                  rows={4}
                  className="text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={submitResponse} disabled={!response.trim()} size="sm" className="text-sm">
                  Submit Response
                </Button>
                <Button variant="outline" onClick={() => setSelectedFeedback(null)} size="sm" className="text-sm">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 