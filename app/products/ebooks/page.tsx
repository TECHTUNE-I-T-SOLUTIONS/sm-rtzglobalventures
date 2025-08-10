"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { toast } from "react-hot-toast"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Download, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Ebook {
  id: string
  title: string
  description: string
  author: string
  price: number
  cover_image_url: string
  file_url: string
  is_free: boolean
}

export default function EbooksPage() {
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const router = useRouter()

  // Filtering and Pagination states
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPrice, setFilterPrice] = useState("all") // 'all', 'free', 'paid'
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8) // Display fewer items per page for a cleaner look
  const [totalEbooks, setTotalEbooks] = useState(0)

  useEffect(() => {
    fetchEbooks()
  }, [searchTerm, filterPrice, currentPage, itemsPerPage])

  const fetchEbooks = async () => {
    setLoading(true)
    let query = supabase.from("ebooks").select("*", { count: 'exact' })

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }

    if (filterPrice === 'free') {
      query = query.eq('price', 0)
    } else if (filterPrice === 'paid') {
      query = query.gt('price', 0)
    }

    const from = (currentPage - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, error, count } = await query

    if (error) {
      toast.error("Failed to fetch ebooks: " + error.message)
      console.error("Error fetching ebooks:", error)
      return
    }
    setEbooks(data || [])
    setTotalEbooks(count || 0)
    setLoading(false)
  }

  const handleAddToCart = (ebook: Ebook) => {
    addItem({ id: ebook.id, name: ebook.title, price: ebook.price, quantity: 1, image: ebook.cover_image_url }, 'ebook')
  }

  const totalPages = Math.ceil(totalEbooks / itemsPerPage)

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-6">Our E-book Collection</h1>
        <p className="text-center text-muted-foreground mb-12">Discover a wide range of digital books for all your needs.</p>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-center">
          <div className="relative w-full sm:w-1/2 lg:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search e-books by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 bg-card border-border"
            />
          </div>
          <select
            value={filterPrice}
            onChange={(e) => setFilterPrice(e.target.value)}
            className="w-full sm:w-auto p-2 border rounded-md bg-white dark:bg-black text-foreground border-border"
          >
            <option value="all">All Prices</option>
            <option value="free">Free E-books</option>
            <option value="paid">Paid E-books</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <p>Loading e-books...</p>
          </div>
        ) : ebooks.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-muted-foreground">No E-books Found</h2>
            <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {ebooks.map((ebook) => (
              <Card key={ebook.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="p-0 relative">
                  <img 
                    src={ebook.cover_image_url || '/placeholder.jpg'} 
                    alt={ebook.title} 
                    className="w-full h-56 object-cover"
                  />
                  {ebook.is_free && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">FREE</span>
                  )}
                </CardHeader>
                <CardContent className="flex-1 p-4">
                  <CardTitle className="text-xl font-semibold mb-2 line-clamp-2">{ebook.title}</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm mb-2">by {ebook.author}</CardDescription>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{ebook.description}</p>
                </CardContent>
                <CardFooter className="p-4 border-t flex justify-between items-center bg-card-foreground/5">
                  {ebook.is_free ? (
                    <Button variant="outline" onClick={async () => {
                      await addItem({ id: ebook.id, name: ebook.title, price: ebook.price, quantity: 1, image: ebook.cover_image_url }, 'ebook');
                      router.push('/checkout');
                    }} className="w-full border-primary text-primary hover:bg-primary/10">
                      <Download className="h-4 w-4 mr-2" /> Get for Free
                    </Button>
                  ) : (
                    <Button onClick={() => handleAddToCart(ebook)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      <DollarSign className="h-4 w-4 mr-2" /> Add to Cart (₦{ebook.price.toLocaleString()})
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-card border-border"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="bg-card border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}