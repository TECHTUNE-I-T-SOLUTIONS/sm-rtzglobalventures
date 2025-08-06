"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { Trash2, Plus, Minus } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

export function CartItems() {
  const { items, loading, updateQuantity, removeItem } = useCart()

  if (loading) {
    return (
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle>Cart Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Cart Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg bg-background"
          >
            {/* Product Image */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={
                  item.products.image_url ||
                  `/placeholder.svg?height=80&width=80&query=${item.products.name || "/placeholder.svg"}`
                }
                alt={item.products.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate">{item.products.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">₦{item.products.price.toLocaleString()}</p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Price and Remove */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4">
              <div className="text-right">
                <p className="font-semibold text-sm sm:text-base">₦{(item.products.price * item.quantity).toLocaleString()}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeItem(item.id)}
                className="text-destructive hover:text-destructive h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}
