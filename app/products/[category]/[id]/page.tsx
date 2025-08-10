"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useCart } from "@/contexts/cart-context"
import { useAuthStore } from "@/hooks/use-auth"
import { ShoppingCart, Heart, ArrowLeft, Star, Truck, Shield, RotateCcw } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import toast from "react-hot-toast"
import { motion } from "framer-motion"

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: "computers" | "books"
  subcategory: string | null
  image_url: string | null
  stock_quantity: number
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const { addItem, items } = useCart()

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    if (product && user) {
      checkWishlistStatus(product.id)
    }
  }, [product, user])

  const isInCart = items.some(item => item.product_id === product?.id)

  const fetchProduct = async (id: string) => {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

      if (error) throw error
      setProduct(data)
    } catch (error) {
      console.error("Error fetching product:", error)
      toast.error("Product not found")
      router.push("/products")
    } finally {
      setLoading(false)
    }
  }

  const checkWishlistStatus = async (productId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      setIsInWishlist(!!data)
    } catch (error) {
      console.error("Error checking wishlist status:", error)
    }
  }

  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Please log in to add items to your wishlist")
      return
    }

    if (!product) return

    setWishlistLoading(true)
    try {
      if (isInWishlist) {
        // Remove from wishlist
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id)

        if (error) throw error

        setIsInWishlist(false)
        toast.success("Removed from wishlist")
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from("wishlist_items")
          .insert({
            user_id: user.id,
            product_id: product.id,
          })

        if (error) throw error

        setIsInWishlist(true)
        toast.success("Added to wishlist")
      }
    } catch (error: any) {
      console.error("Error toggling wishlist:", error)
      toast.error(error.message || "Failed to update wishlist")
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (product) {
      addItem(
        { 
          id: product.id, 
          name: product.name, 
          price: product.price, 
          quantity: quantity, 
          image: product.image_url 
        }, 
        'product'
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
            <Link href="/products">
              <Button>Back to Products</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/products" className="inline-flex items-center text-primary hover:text-primary/80">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Card className="bg-card border">
              <CardContent className="p-6">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={
                      product.image_url ||
                      `/placeholder.svg?height=500&width=500&query=${product.category || "/placeholder.svg"}+${product.name}`
                    }
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.category === "computers" ? "Computer Accessories" : "Books & Literature"}
              </Badge>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(4.8) • 124 reviews</span>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed">{product.description}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-primary">₦{product.price.toLocaleString()}</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    product.stock_quantity > 0
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg bg-background">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-muted rounded-l-lg"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="px-3 py-2 hover:bg-muted rounded-r-lg"
                    disabled={quantity >= product.stock_quantity}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  className="flex-1" 
                  onClick={handleAddToCart} 
                  disabled={product.stock_quantity === 0}
                  variant={isInCart ? "secondary" : "default"}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isInCart ? "In Cart" : "Add to Cart"}
                </Button>
                <Button 
                  size="lg" 
                  variant={isInWishlist ? "default" : "outline"} 
                  className={`bg-background ${isInWishlist ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                >
                  {wishlistLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Heart className={`h-5 w-5 ${isInWishlist ? "fill-current" : ""}`} />
                  )}
                </Button>
              </div>
            </div>

            {/* Features */}
            <Card className="bg-card border">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Free Delivery</p>
                      <p className="text-sm text-muted-foreground">On orders over ₦10,000</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Warranty</p>
                      <p className="text-sm text-muted-foreground">1 year guarantee</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RotateCcw className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Easy Returns</p>
                      <p className="text-sm text-muted-foreground">30-day return policy</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}