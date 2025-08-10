"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle, Download, Package } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "react-hot-toast"

interface EbookDetails {
  id: string
  title: string
  file_url: string
}

export default function MixedSuccessPage() {
  const searchParams = useSearchParams()
  const [ebooks, setEbooks] = useState<EbookDetails[]>([])
  const [loading, setLoading] = useState(true)
  const reference = searchParams.get("reference")

  useEffect(() => {
    const fetchEbookDetails = async () => {
      const ebookIds = searchParams.get("ebookIds")
      if (!ebookIds) {
        console.warn("Mixed success page reached without ebook IDs.")
        setLoading(false)
        return
      }

      try {
        const idsArray = ebookIds.split(",")
        const { data, error } = await supabase
          .from("ebooks")
          .select("id, title, file_url")
          .in("id", idsArray)

        if (error) throw error
        setEbooks(data || [])
      } catch (error: any) {
        console.error("Error fetching ebook details:", error)
        toast.error("Failed to load your purchased ebook details.")
      } finally {
        setLoading(false)
      }
    }

    fetchEbookDetails()
  }, [searchParams])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-lg shadow-lg text-center max-w-lg w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Order Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Your order <span className="font-mono text-primary">{reference}</span> containing digital and physical items has been placed.
          </p>

          {loading ? (
            <div className="animate-pulse h-10 bg-muted rounded-md w-full"></div>
          ) : ebooks.length > 0 ? (
            <div className="space-y-4 mb-6 text-left">
              <h2 className="font-semibold text-lg">Your Digital Items</h2>
              {ebooks.map((ebook) => (
                <div key={ebook.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                  <span className="font-medium">{ebook.title}</span>
                  <Button variant="outline" size="sm" onClick={() => window.open(ebook.file_url, "_blank")}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
          
          <div className="p-4 border rounded-md bg-muted/20 mb-6 text-left">
             <h2 className="font-semibold text-lg mb-2">Your Physical Items</h2>
             <p className="text-muted-foreground text-sm">
                Your physical products will be processed for shipping. You can track their status from your dashboard.
             </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/dashboard/orders">
                <Package className="h-4 w-4 mr-2" /> View Order Status
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/products">
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
