"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, ArrowRight, Home } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useCart } from "@/hooks/use-cart"

function CheckoutSuccess() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { clearCart } = useCart()
  const [cartCleared, setCartCleared] = useState(false)

  useEffect(() => {
    if (reference && !cartCleared) {
      fetchOrderDetails()
      clearCart()
      setCartCleared(true)
    }
  }, [reference, cartCleared, clearCart])

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              price,
              image_url
            )
          )
        `)
        .eq("payment_reference", reference)
        .single()

      if (error) throw error
      setOrderDetails(data)
    } catch (error) {
      console.error("Error fetching order details:", error)
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Thank you for your order. We'll send you an email confirmation shortly.
            </p>
          </motion.div>

          {orderDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-card border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Order ID</p>
                      <p className="font-semibold">{orderDetails.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Reference</p>
                      <p className="font-semibold">{orderDetails.payment_reference}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">₦{orderDetails.total_amount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-semibold capitalize">{orderDetails.status}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Order Items</h3>
                    <div className="space-y-2">
                      {orderDetails.order_items?.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span>{item.products?.name}</span>
                          <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <p className="text-sm text-muted-foreground">
                      {typeof orderDetails.shipping_address === 'object' && orderDetails.shipping_address !== null
                        ? `${orderDetails.shipping_address.address}, ${orderDetails.shipping_address.city}, ${orderDetails.shipping_address.state}`
                        : orderDetails.shipping_address}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 mt-8"
          >
            <Link href="/dashboard/orders" className="flex-1">
              <Button className="w-full" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                View All Orders
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutSuccess />
    </Suspense>
  )
}