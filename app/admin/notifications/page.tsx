"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import {
  Bell,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  is_read: boolean
  created_at: string
  user_email: string
  user_name: string
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [perPage, setPerPage] = useState<number>(10)
  const [page, setPage] = useState<number>(1)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    filterNotifications()
  }, [notifications, searchQuery, typeFilter, statusFilter])

  // reset page when filters/search change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, typeFilter, statusFilter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data: notifications, error } = await supabase
        .from("notifications")
        .select(`
          *,
          profiles!notifications_user_id_fkey(email, full_name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const notificationsData: Notification[] = (notifications || []).map((notification) => ({
        id: notification.id,
        user_id: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type as Notification["type"],
        is_read: notification.is_read,
        created_at: notification.created_at,
        user_email: notification.profiles?.email || "",
        user_name: notification.profiles?.full_name || "",
      }))

      setNotifications(notificationsData)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast.error("Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }

  const filterNotifications = () => {
    let filtered = [...notifications]

    if (searchQuery) {
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          notification.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (notification.user_name && notification.user_name.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    if (typeFilter) {
      filtered = filtered.filter((notification) => notification.type === typeFilter)
    }

    if (statusFilter) {
      if (statusFilter === "read") {
        filtered = filtered.filter((notification) => notification.is_read)
      } else if (statusFilter === "unread") {
        filtered = filtered.filter((notification) => !notification.is_read)
      }
    }

    setFilteredNotifications(filtered)
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

      if (error) throw error

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, is_read: true } : notification,
        ),
      )
      toast.success("Notification marked as read")
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("is_read", false)

      if (error) throw error

      setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })))
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast.error("Failed to mark all notifications as read")
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

      if (error) throw error

      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId))
      toast.success("Notification deleted")
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast.error("Failed to delete notification")
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
      case "error":
        return <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
      default:
        return <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-black"
            >
              <option value="">All Types</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
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

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const pageCount = Math.max(1, Math.ceil(filteredNotifications.length / perPage))
  const start = (page - 1) * perPage
  const end = start + perPage
  const paginatedNotifications = filteredNotifications.slice(start, end)

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage system notifications and alerts</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            size={isMobile ? "sm" : "default"}
            className="text-xs sm:text-sm bg-transparent"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button
            variant="outline"
            onClick={fetchNotifications}
            size={isMobile ? "sm" : "default"}
            className="text-xs sm:text-sm bg-transparent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Notifications</p>
                <p className="text-lg sm:text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
              <EyeOff className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Read</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{notifications.length - unreadCount}</p>
              </div>
              <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Today</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {
                    notifications.filter((n) => new Date(n.created_at).toDateString() === new Date().toDateString())
                      .length
                  }
                </p>
              </div>
              <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
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
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <select
              aria-label="Filter by type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-black"
            >
              <option value="">All Types</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-black"
            >
              <option value="">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Notifications ({filteredNotifications.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredNotifications.length === 0 ? 0 : start + 1}-{Math.min(end, filteredNotifications.length)} of {filteredNotifications.length}
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Items per page"
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
                className="px-2 py-1 border rounded bg-white dark:bg-black text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
              </select>
              <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
              <Button size="sm" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next</Button>
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Bell className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">No notifications found</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {searchQuery || typeFilter || statusFilter
                  ? "Try adjusting your filters"
                  : "No notifications available"}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`border rounded-lg p-3 sm:p-4 bg-background flex flex-col justify-between hover:shadow-md transition-shadow ${
                    !notification.is_read ? "border-primary/50 bg-primary/5" : ""
                  }`}
                >
                  <div className="space-y-2 sm:space-y-3 w-full overflow-hidden">
                    <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                      {/* Left: Title + Name/Email */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base break-words line-clamp-1">
                          {notification.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground break-words line-clamp-1">
                          {notification.user_name || "Unknown"} • {notification.user_email}
                        </p>
                      </div>

                      {/* Right: Badges */}
                      <div className="flex flex-col gap-1 ml-2 shrink-0">
                        <Badge className={`${getTypeColor(notification.type)} text-[10px] sm:text-xs`}>
                          {getTypeIcon(notification.type)}
                          <span className="ml-1">{notification.type}</span>
                        </Badge>
                        {!notification.is_read && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            Unread
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed break-words">
                      {notification.message}
                    </p>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{new Date(notification.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs flex-1 sm:flex-none"
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Mark Read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedNotification(notification)}
                      className="text-xs flex-1 sm:flex-none"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Details Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => setSelectedNotification(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-black rounded-lg w-full max-w-[95vw] sm:max-w-lg lg:max-w-2xl max-h-[95vh] overflow-y-auto p-3 sm:p-4 lg:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Notification Details</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedNotification(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Notification Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Notification ID</p>
                        <p className="font-semibold text-sm sm:text-base break-all">
                          #{selectedNotification.id.slice(-8)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Created</p>
                        <p className="font-semibold text-sm sm:text-base break-words">
                          {new Date(selectedNotification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getTypeColor(selectedNotification.type)}>
                        {getTypeIcon(selectedNotification.type)}
                        <span className="ml-1">{selectedNotification.type}</span>
                      </Badge>
                      <Badge variant={selectedNotification.is_read ? "outline" : "default"}>
                        {selectedNotification.is_read ? "Read" : "Unread"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">User Name</p>
                        <p className="font-semibold text-sm sm:text-base break-words">
                          {selectedNotification.user_name || "Not provided"}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Email</p>
                        <p className="font-semibold text-sm sm:text-base break-all">
                          {selectedNotification.user_email}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Message Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Title</p>
                      <p className="font-semibold text-sm sm:text-base break-words">{selectedNotification.title}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Message</p>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                        {selectedNotification.message}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                      {!selectedNotification.is_read && (
                        <Button
                          onClick={() => {
                            markAsRead(selectedNotification.id)
                            setSelectedNotification(null)
                          }}
                          size={isMobile ? "sm" : "default"}
                          className="text-xs sm:text-sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Read
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setSelectedNotification(null)}
                        size={isMobile ? "sm" : "default"}
                        className="text-xs sm:text-sm"
                      >
                        Close
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          deleteNotification(selectedNotification.id)
                          setSelectedNotification(null)
                        }}
                        size={isMobile ? "sm" : "default"}
                        className="text-xs sm:text-sm"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
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
