"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { Bell, Check, Trash2, Package, AlertCircle, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
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
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user?.id)
        .eq("is_read", false)
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
      case "warning":
        return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
      default:
        return <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
    }
  }

  const getNotificationBorderColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-l-green-500"
      case "warning":
        return "border-l-yellow-500"
      case "error":
        return "border-l-red-500"
      default:
        return "border-l-blue-500"
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && <Badge variant="destructive" className="ml-2">{unreadCount} unread</Badge>}
          </div>
          <div className="space-y-3 sm:space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="bg-card border shadow-sm rounded-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && <Badge variant="destructive" className="ml-2">{unreadCount} unread</Badge>}
          </div>
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead} 
              variant="outline" 
              size="sm"
              className="bg-background border-primary text-primary hover:bg-primary/10 transition w-full sm:w-auto"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="bg-card border shadow-md rounded-xl">
            <CardContent className="p-8 sm:p-12 text-center flex flex-col items-center">
              <Bell className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">No notifications</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                You're all caught up! We'll notify you when something important happens.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.07 }}
              >
                <Card
                  className={`bg-card border-l-4 ${getNotificationBorderColor(notification.type)} ${
                    !notification.is_read ? "bg-primary/5" : ""
                  } hover:shadow-lg transition-shadow rounded-xl`}
                >
                  <CardContent className="p-4 sm:p-5 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="mt-1 flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                            <h3 className="font-semibold text-base sm:text-lg truncate">{notification.title}</h3>
                            {!notification.is_read && <div className="w-2 h-2 bg-primary rounded-full animate-pulse flex-shrink-0 mt-2"></div>}
                          </div>
                          <p className="text-sm sm:text-base text-muted-foreground mb-2 break-words">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {!notification.is_read && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                            className="hover:bg-primary/10 h-8 w-8 sm:h-10 sm:w-10"
                            aria-label="Mark as read"
                          >
                            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-10 sm:w-10"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
