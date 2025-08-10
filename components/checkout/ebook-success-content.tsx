"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle, Download } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "react-hot-toast"

interface EbookDetails {
  id: string
  title: string
  file_url: string
}

export function EbookSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ebooks, setEbooks] = useState<EbookDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEbookDetails = async () => {
      const ebookIds = searchParams.get("ebookIds")
      if (!ebookIds) {
        toast.error("No ebook IDs found.")
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
        toast.error("Failed to load ebook details.")
      } finally {
        setLoading(false)
      }
    }

    fetchEbookDetails()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading ebook details...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-lg shadow-lg text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">E-books Acquired Successfully!</h1>
          <p className="text-muted-foreground mb-6">
            Your free e-books are ready for download. You can also find them in your dashboard.
          </p>

          <div className="space-y-4 mb-6">
            {ebooks.map((ebook) => (
              <div key={ebook.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                <span className="font-medium">{ebook.title}</span>
                <Button variant="outline" size="sm" onClick={() => window.open(ebook.file_url, "_blank")}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/dashboard/ebooks">
                <BookOpen className="h-4 w-4 mr-2" /> Go to My E-books
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/products/ebooks">
                Continue Browsing E-books
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
