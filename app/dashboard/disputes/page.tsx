"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { 
  AlertCircle,
  Calendar, 
  Clock, 
  MessageSquare, 
  RefreshCw, 
  ShieldCheck, 
  Tag, 
  User, 
  XCircle 
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import toast from "react-hot-toast"

interface Dispute {
  id: string
  order_id: string
  reason: string
  description: string
  status: string
  priority: string
  amount: number
  admin_notes: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

export default function DisputesPage() {
  const { user } = useAuth()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDisputes()
    }
  }, [user])

  const fetchDisputes = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setDisputes(data || [])
    } catch (error) {
      console.error("Error fetching disputes:", error)
      toast.error("Failed to fetch disputes")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
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

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-card border">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            My Disputes
          </h1>
          <Button variant="outline" size="sm" onClick={fetchDisputes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {disputes.length === 0 ? (
          <Card className="bg-card border">
            <CardContent className="p-12 text-center">
              <ShieldCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No disputes found</h3>
              <p className="text-muted-foreground">You haven't created any disputes yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {disputes.map((dispute) => (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Tag className="h-5 w-5" />
                          {dispute.reason}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Order ID: {dispute.order_id.slice(-8)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(dispute.status)}>{dispute.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{dispute.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> Created</p>
                        <p>{new Date(dispute.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1"><Calendar className="h-4 w-4" /> Last Updated</p>
                        <p>{new Date(dispute.updated_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {dispute.admin_notes && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><User className="h-4 w-4" /> Admin Notes</h4>
                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">{dispute.admin_notes}</p>
                      </div>
                    )}
                    {dispute.resolution_notes && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Resolution</h4>
                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">{dispute.resolution_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
