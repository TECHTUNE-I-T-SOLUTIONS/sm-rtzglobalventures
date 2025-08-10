"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Book, 
  Search, 
  Download, 
  List, 
  LayoutGrid, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react"
import toast from "react-hot-toast"

export default function UserEbooksPage() {
  const { user, loading: authLoading } = useAuth()
  const [acquiredEbooks, setAcquiredEbooks] = useState<any[]>([])
  const [filteredEbooks, setFilteredEbooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)

  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("acquired_date_desc")

  useEffect(() => {
    if (user) {
      fetchAcquiredEbooks()
    }
  }, [user])

  useEffect(() => {
    const filterAndSortEbooks = () => {
      let updatedEbooks = [...acquiredEbooks]

      // Filter by search term
      if (searchTerm) {
        updatedEbooks = updatedEbooks.filter(item =>
          item.ebooks.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.ebooks.author.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Sort ebooks
      updatedEbooks.sort((a, b) => {
        const aTitle = a.ebooks.title.toLowerCase()
        const bTitle = b.ebooks.title.toLowerCase()
        const aDate = new Date(a.acquired_date).getTime()
        const bDate = new Date(b.acquired_date).getTime()

        switch (sortBy) {
          case "acquired_date_desc":
            return bDate - aDate
          case "acquired_date_asc":
            return aDate - bDate
          case "title_asc":
            return aTitle.localeCompare(bTitle)
          case "title_desc":
            return bTitle.localeCompare(aTitle)
          default:
            return 0
        }
      })

      setFilteredEbooks(updatedEbooks)
    }

    filterAndSortEbooks()
  }, [searchTerm, sortBy, acquiredEbooks])

  const fetchAcquiredEbooks = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("acquired_ebooks")
        .select(`
          id,
          acquired_date,
          ebooks (
            id,
            title,
            description,
            author,
            price,
            cover_image_url,
            file_url,
            file_type
          )
        `)
        .eq("user_id", user.id)
        .order("acquired_date", { ascending: false })

      if (error) throw error
      setAcquiredEbooks(data || [])
    } catch (error: any) {
      console.error("Error fetching acquired ebooks:", error)
      toast.error("Failed to load your ebooks.")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (fileUrl: string, title: string) => {
    window.open(fileUrl, "_blank")
    toast.success(`Downloading ${title}...`)
  }

  // Pagination logic
  const paginatedEbooks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredEbooks.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredEbooks, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredEbooks.length / itemsPerPage) 
  
  const EbookGrid = ({ ebooks }: { ebooks: any[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {ebooks.map(item => (
        <Card key={item.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="p-0 relative">
            <Image
              src={item.ebooks.cover_image_url || '/placeholder.jpg'}
              alt={item.ebooks.title}
              width={300}
              height={400}
              className="w-full h-56 object-cover"
            />
          </CardHeader>
          <CardContent className="flex-1 p-4">
            <CardTitle className="text-xl font-semibold mb-2 line-clamp-2">{item.ebooks.title}</CardTitle>
            <CardDescription className="text-muted-foreground text-sm mb-2">by {item.ebooks.author}</CardDescription>
          </CardContent>
          <div className="p-4 border-t flex justify-between items-center bg-card-foreground/5">
            <Button onClick={() => handleDownload(item.ebooks.file_url, item.ebooks.title)} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )

  const EbookList = ({ ebooks }: { ebooks: any[] }) => (
    <div className="space-y-4">
      {ebooks.map(item => (
        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
          <Image
            src={item.ebooks.cover_image_url || '/placeholder.jpg'}
            alt={item.ebooks.title}
            width={80}
            height={120}
            className="w-20 h-28 object-cover rounded-md shadow-sm"
          />
          <div className="flex-1">
            <h3 className="font-bold text-lg">{item.ebooks.title}</h3>
            <p className="text-sm text-muted-foreground">by {item.ebooks.author}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Acquired on: {new Date(item.acquired_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => handleDownload(item.ebooks.file_url, item.ebooks.title)} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      ))}
    </div>
  )

  if (authLoading || loading) {
    return (
        <div className="min-h-screen">
            <Header />
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <p>Loading your ebooks...</p>
            </div>
            <Footer />
        </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-3">
                    <Book className="h-8 w-8 text-primary" />
                    My E-books
                </h1>
                <p className="mt-2 text-muted-foreground">Access and manage all the e-books you've acquired.</p>
            </div>
        </div>

        <Card className="mb-8">
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                        placeholder="Search by title or author..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            Sort By
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setSortBy("acquired_date_desc")}>Date Acquired (Newest)</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setSortBy("acquired_date_asc")}>Date Acquired (Oldest)</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setSortBy("title_asc")}>Title (A-Z)</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setSortBy("title_desc")}>Title (Z-A)</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="flex items-center rounded-md bg-muted p-1">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode("grid")}
                            className="h-8 w-8"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode("list")}
                            className="h-8 w-8"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {filteredEbooks.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-muted-foreground">No E-books Found</h2>
            <p className="text-muted-foreground mt-2">
              {searchTerm
                ? "No ebooks match your search. Try a different term." : (
                <>You haven't acquired any ebooks yet. <Link href='/products/ebooks' className='text-primary hover:underline'>Explore our collection</Link>.</>
                )
              }
            </p>
          </div>
        ) : (
          <div>
            {viewMode === "grid" ? <EbookGrid ebooks={paginatedEbooks} /> : <EbookList ebooks={paginatedEbooks} />}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
