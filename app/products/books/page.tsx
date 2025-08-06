"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductGrid } from "@/components/products/product-grid"
import { ProductFilters } from "@/components/products/product-filters"
import { SearchBar } from "@/components/products/search-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { BookOpen, Filter } from "lucide-react"
import { motion } from "framer-motion"

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  subcategory: string | null
  image_url: string | null
  stock_quantity: number
  is_active: boolean
  created_at: string
}

interface Filters {
  priceRange: [number, number]
  subcategory: string
  inStock: boolean
  sortBy: string
}

export default function BooksPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    priceRange: [0, 50000],
    subcategory: "",
    inStock: false,
    sortBy: "newest",
  })

  useEffect(() => {
    fetchBooks()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [products, searchQuery, filters])

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", "books")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching books:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.subcategory && product.subcategory.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Price range filter
    filtered = filtered.filter(
      (product) => product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1],
    )

    // Subcategory filter
    if (filters.subcategory) {
      filtered = filtered.filter((product) => product.subcategory === filters.subcategory)
    }

    // Stock filter
    if (filters.inStock) {
      filtered = filtered.filter((product) => product.stock_quantity > 0)
    }

    // Sort
    switch (filters.sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    setFilteredProducts(filtered)
  }

  const subcategories = Array.from(new Set(products.map((p) => p.subcategory).filter(Boolean)))

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Sm@rtz Bookshop & Bookstore</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover a world of knowledge with our extensive collection of academic books, literature, and educational
            materials
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Badge variant="secondary" className="text-sm">
              {products.length} Books Available
            </Badge>
            <Badge variant="outline" className="text-sm">
              Academic & Literature
            </Badge>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
            <div className="w-full lg:w-96">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search books..." />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters
                {showFilters && <Badge variant="secondary">On</Badge>}
              </button>
              <div className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {products.length} books
              </div>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Filter Books</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    subcategories={subcategories}
                    maxPrice={Math.max(...products.map((p) => p.price), 50000)}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Products Grid */}
        <ProductGrid products={filteredProducts} loading={loading} category="books" />

        {/* Categories Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Academic Books</h3>
                  <p className="text-muted-foreground">
                    Comprehensive textbooks and reference materials for all academic levels
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Literature</h3>
                  <p className="text-muted-foreground">Classic and contemporary literature from renowned authors</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Educational Materials</h3>
                  <p className="text-muted-foreground">Study guides, workbooks, and supplementary learning resources</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
