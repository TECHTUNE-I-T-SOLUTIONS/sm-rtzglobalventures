"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/contexts/cart-context"
import { CreditCard } from "lucide-react"
import Link from "next/link"

export function CartSummary() {
  const { totalPrice, totalItems, loading } = useCart()
  const subtotal = totalPrice
  const shipping = subtotal > 10000 ? 2000 : 0
  const total = subtotal + shipping
  
  if (loading) {
    return (
      <Card className="bg-card border sticky top-4">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Order Summary</CardTitle>
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
    <Card className="bg-card border sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm sm:text-base">
            <span>Subtotal ({totalItems} items)</span>
            <span>₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm sm:text-base">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : `₦${shipping.toLocaleString()}`}</span>
          </div>
          {shipping === 0 && (
            <p className="text-xs sm:text-sm text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded">
              Free shipping on orders over ₦10,000!
            </p>
          )}
        </div>

        <Separator />

        <div className="flex justify-between font-semibold text-lg sm:text-xl">
          <span>Total</span>
          <span>₦{total.toLocaleString()}</span>
        </div>

        <Link href="/checkout" className="w-full">
          <Button size="lg" className="w-full text-sm sm:text-base">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Proceed to Checkout
          </Button>
        </Link>

        <div className="text-center text-xs sm:text-sm text-muted-foreground">
          <p>Secure checkout with SSL encryption</p>
        </div>
      </CardContent>
    </Card>
  )
}
