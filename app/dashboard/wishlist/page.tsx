"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Search, 
  Filter, 
  Package, 
  Eye,
  Star,
  TrendingUp,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  SortAsc,
  Grid3X3,
  List,
  Share2,
  Download,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import toast from "react-hot-toast"

interface WishlistItem {
  id: string
  created_at: string
  products: {
    id: string
    name: string
    description: string
    price: number
    image_url: string
    category: string
    stock_quantity: number
    is_active: boolean
  }
}

export default function WishlistPage() {
  const { user } = useAuth()
  const { addItem: addToCart } = useCart()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [filteredItems, setFilteredItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      fetchWishlist()
    }
  }, [user])

  useEffect(() => {
    filterAndSortItems()
  }, [wishlistItems, searchQuery, categoryFilter, sortBy])

  const fetchWishlist = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("wishlist_items")
        .select(`
          *,
          products (
            id,
            name,
            description,
            price,
            image_url,
            category,
            stock_quantity,
            is_active
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setWishlistItems(data || [])
    } catch (error) {
      console.error("Error fetching wishlist:", error)
      toast.error("Failed to fetch wishlist")
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortItems = () => {
    let filtered = wishlistItems

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.products.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.products.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.products.category === categoryFilter)
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "price_high":
          return b.products.price - a.products.price
        case "price_low":
          return a.products.price - b.products.price
        case "name":
          return a.products.name.localeCompare(b.products.name)
        default:
          return 0
      }
    })

    setFilteredItems(filtered)
  }

  const removeFromWishlist = async (itemId: string) => {
    try {
      const { error } = await supabase.from("wishlist_items").delete().eq("id", itemId)

      if (error) throw error

      setWishlistItems((prev) => prev.filter((item) => item.id !== itemId))
      setSelectedItems((prev) => prev.filter((id) => id !== itemId))
      toast.success("Removed from wishlist")
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      toast.error("Failed to remove from wishlist")
    }
  }

  const handleAddToCart = async (product: any) => {
    try {
      await addToCart(product, 1)
      toast.success("Added to cart!")
    } catch (error) {
      toast.error("Failed to add to cart")
    }
  }

  const clearWishlist = async () => {
    if (!confirm("Are you sure you want to clear your entire wishlist?")) return

    try {
      const { error } = await supabase.from("wishlist_items").delete().eq("user_id", user?.id)

      if (error) throw error

      setWishlistItems([])
      setSelectedItems([])
      toast.success("Wishlist cleared")
    } catch (error) {
      console.error("Error clearing wishlist:", error)
      toast.error("Failed to clear wishlist")
    }
  }

  const removeSelectedItems = async () => {
    if (selectedItems.length === 0) return

    try {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .in("id", selectedItems)

      if (error) throw error

      setWishlistItems((prev) => prev.filter((item) => !selectedItems.includes(item.id)))
      setSelectedItems([])
      toast.success(`Removed ${selectedItems.length} items from wishlist`)
    } catch (error) {
      console.error("Error removing selected items:", error)
      toast.error("Failed to remove selected items")
    }
  }

  const addSelectedToCart = async () => {
    if (selectedItems.length === 0) return

    try {
      const selectedProducts = wishlistItems
        .filter((item) => selectedItems.includes(item.id))
        .map((item) => item.products)

      for (const product of selectedProducts) {
        await addToCart(product.id, 1)
      }

      toast.success(`Added ${selectedItems.length} items to cart`)
    } catch (error) {
      toast.error("Failed to add items to cart")
    }
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }

  const categories = Array.from(new Set(wishlistItems.map((item) => item.products.category)))

  const stats = {
    total: wishlistItems.length,
    inStock: wishlistItems.filter((item) => item.products.is_active && item.products.stock_quantity > 0).length,
    outOfStock: wishlistItems.filter((item) => !item.products.is_active || item.products.stock_quantity === 0).length,
    totalValue: wishlistItems.reduce((sum, item) => sum + item.products.price, 0),
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-card border">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="bg-card border">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </div>
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
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
                <Heart className="h-8 w-8 text-red-500" />
                My Wishlist
              </h1>
              <p className="text-muted-foreground mt-2">
                Save items you love and shop them later
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {filteredItems.length} items
              </Badge>
              {wishlistItems.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearWishlist}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Items", value: stats.total, icon: Heart, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
              { label: "In Stock", value: stats.inStock, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
              { label: "Out of Stock", value: stats.outOfStock, icon: XCircle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" },
              { label: "Total Value", value: `₦${stats.totalValue.toLocaleString()}`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`${stat.bg} border-0 shadow-sm hover:shadow-md transition-shadow`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {wishlistItems.length === 0 ? (
            <Card className="bg-card border shadow-sm">
              <CardContent className="p-12 text-center">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Save items you love to your wishlist and shop them later. Start browsing our products to find something you like!
                </p>
                <Link href="/products">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Package className="h-4 w-4 mr-2" />
                    Browse Products
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filters and Actions */}
              <Card className="bg-card border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-col lg:flex-row">
                    {/* Search Input */}
                    <div className="w-full lg:flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search wishlist items..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-full"
                        />
                      </div>
                    </div>

                    {/* Filters & View Toggle */}
                    <div className="w-full flex flex-wrap gap-2 sm:gap-3 lg:justify-end">
                      {/* Category Filter */}
                      <div className="relative w-full sm:w-auto">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="pl-10 pr-8 py-2 w-full sm:w-auto border rounded-md bg-white dark:bg-black text-sm appearance-none cursor-pointer"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sort Filter */}
                      <div className="relative w-full sm:w-auto">
                        <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="pl-10 pr-8 py-2 w-full sm:w-auto border rounded-md bg-white dark:bg-black text-sm appearance-none cursor-pointer"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="price_high">Price: High to Low</option>
                          <option value="price_low">Price: Low to High</option>
                          <option value="name">Name A-Z</option>
                        </select>
                      </div>

                      {/* View Mode Toggle */}
                      <div className="flex border rounded-md w-full sm:w-auto">
                        <Button
                          variant={viewMode === "grid" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                          className="rounded-r-none w-1/2 sm:w-auto"
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("list")}
                          className="rounded-l-none w-1/2 sm:w-auto"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>


                  {/* Bulk Actions */}
                  {selectedItems.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        {selectedItems.length} items selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addSelectedToCart}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeSelectedItems}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Selected
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Wishlist Items */}
              {filteredItems.length === 0 ? (
                <Card className="bg-card border shadow-sm">
                  <CardContent className="p-8 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No items found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or filters</p>
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
                }>
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="group hover:shadow-lg transition-all duration-300">
                        <div className="relative">
                          <div className={`${viewMode === "grid" ? "aspect-square" : "h-32"} bg-muted rounded-t-lg overflow-hidden`}>
                            {item.products.image_url ? (
                              <img
                                src={item.products.image_url || "/placeholder.svg"}
                                alt={item.products.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-16 w-16 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          {/* Selection Checkbox */}
                          <div className="absolute top-2 left-2">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => toggleItemSelection(item.id)}
                              className="w-4 h-4 text-primary bg-background border-gray-300 rounded focus:ring-primary"
                            />
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                            onClick={() => removeFromWishlist(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>

                          {/* Stock Status */}
                          {!item.products.is_active && (
                            <Badge className="absolute bottom-2 left-2 bg-red-500">Out of Stock</Badge>
                          )}
                          
                          {/* Stock Quantity */}
                          {item.products.stock_quantity <= 5 && item.products.stock_quantity > 0 && (
                            <Badge className="absolute bottom-2 right-2 bg-orange-500">
                              Only {item.products.stock_quantity} left
                            </Badge>
                          )}
                        </div>

                        <CardContent className={`p-4 ${viewMode === "list" ? "flex items-center gap-4" : ""}`}>
                          <div className={`space-y-3 ${viewMode === "list" ? "flex-1" : ""}`}>
                            <div>
                              <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                {item.products.name}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">{item.products.description}</p>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xl font-bold text-primary">
                                ₦{item.products.price.toLocaleString()}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {item.products.category}
                              </Badge>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                className="flex-1"
                                onClick={() => handleAddToCart(item.products)}
                                disabled={!item.products.is_active || item.products.stock_quantity === 0}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/products/${item.products.category}/${item.products.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Link>
                              </Button>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Added {new Date(item.created_at).toLocaleDateString()}</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Wishlist
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
