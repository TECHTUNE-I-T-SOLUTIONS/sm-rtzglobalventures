"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CartItems } from "@/components/cart/cart-items"
import { CartSummary } from "@/components/cart/cart-summary"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { ShoppingBag, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function CartPage() {
  const { items, totalItems, loading } = useCart()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Link href="/products" className="inline-flex items-center text-primary hover:text-primary/80 text-sm sm:text-base">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
            Shopping Cart {totalItems > 0 && <span className="text-muted-foreground">({totalItems} items)</span>}
          </h1>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-card rounded-lg border">
              <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">Add some products to get started</p>
              <Link href="/products">
                <Button size="lg" className="text-sm sm:text-base">Start Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="lg:col-span-2">
                <CartItems />
              </div>
              <div className="lg:col-span-1">
                <CartSummary />
              </div>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
