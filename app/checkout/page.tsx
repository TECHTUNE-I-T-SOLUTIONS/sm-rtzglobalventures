"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button" 
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/hooks/use-auth"
import { useCart } from "@/contexts/cart-context"
import { supabase } from "@/lib/supabase"
import { CreditCard, MapPin, User, Phone, Mail, Package, ArrowLeft, Lock } from "lucide-react"
import Image from "next/image"
import toast from "react-hot-toast"
import { motion } from "framer-motion"

interface CheckoutForm {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  paymentMethod: "paystack" // Only paystack is now an option
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuthStore() // Use auth loading state
  const { items, totalPrice, clearCart, removeCartItemsByIds } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false) // Renamed for clarity
  const [formData, setFormData] = useState<CheckoutForm>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    paymentMethod: "paystack", // Default to paystack
  })

  const isAllEbooksFree = items.every(item => item.ebook_id && item.ebooks?.price === 0)
  const deliveryFee = isAllEbooksFree ? 0 : 1000 // ₦1,000 delivery fee only for physical products
  const finalTotal = totalPrice + deliveryFee

  useEffect(() => {
    if (authLoading) {
      return // Wait for authentication to complete
    }

    if (!user) {
      toast.error("You must be logged in to checkout.")
      router.push("/auth/login?redirect=/checkout")
      return
    }

    if (items.length === 0) {
      toast("Your cart is empty. Redirecting to shop.")
      router.push("/products") // Redirect to products page if cart is empty
      return
    }

    // Pre-fill form with user data
    fetchUserProfile()
  }, [user, authLoading, items, router])

  const fetchUserProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) throw error

      if (data) {
        setFormData((prev) => ({
          ...prev,
          fullName: data.full_name || "",
          email: user.email || "", // Prefer auth email as it's verified
          phone: data.phone || "",
          address: data.address || "",
        }))
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      toast.error("Could not fetch your profile information.")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const validateForm = () => {
    // If all items are free ebooks, no need for shipping info
    if (isAllEbooksFree) return true

    const required = ["fullName", "email", "phone", "address", "city", "state"]
    for (const field of required) {
      if (!formData[field as keyof Omit<CheckoutForm, 'paymentMethod'>]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`)
        return false
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address")
      return false
    }

    const phoneRegex = /^[+]?[0-9\s-()]{10,}$/
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Please enter a valid phone number")
      return false
    }

    return true
  }

  const handleCheckout = async () => {
    if (!validateForm()) return

    setIsProcessing(true)
    try {
      // Handle free ebooks checkout
      if (isAllEbooksFree) {
        const { data: order, error: orderError } = await supabase.from("orders").insert([
          {
            user_id: user?.id,
            total_amount: 0,
            status: "processing",
            payment_status: "paid",
            shipping_address: {}, // Empty shipping address for digital goods
            payment_method: "free_ebook",
          },
        ]).select().single()

        if (orderError) throw orderError

        // Insert order items, linking to ebooks
        const orderItems = items.map((item) => ({
          order_id: order.id,
          ebook_id: item.ebook_id, // Only ebook_id for free ebooks
          quantity: item.quantity,
          price: 0, // Price is 0 for free ebooks
        }))

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
        if (itemsError) throw itemsError

        // Record acquired ebooks for the user
        const acquiredEbooks = items.map((item) => ({
          user_id: user?.id,
          ebook_id: item.ebook_id,
          acquired_date: new Date().toISOString(),
        }))

        const { error: acquiredError } = await supabase.from("acquired_ebooks").insert(acquiredEbooks)
        // If there's an error and it's NOT a unique constraint violation (23505), then I'll throw it
        if (acquiredError && acquiredError.code !== '23505') {
          throw acquiredError
        }

        // Updates order status to 'delivered' after successful acquisition
        const { error: updateOrderError } = await supabase.from("orders").update({ status: "delivered" }).eq("id", order.id)
        if (updateOrderError) throw updateOrderError

        const itemIds = items.map(item => item.id)
        await removeCartItemsByIds(itemIds)
        const ebookIds = items.filter(item => item.ebook_id).map(item => item.ebook_id).join(",")
        router.push(`/checkout/ebook-success?ebookIds=${ebookIds}`)
        return
      }

      // Proceeds with regular checkout for physical products or paid ebooks
      const orderData = {
        user_id: user?.id,
        total_amount: finalTotal,
        status: "pending",
        payment_status: "pending",
        shipping_address: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
        },
        payment_method: formData.paymentMethod,
      }

      const { data: order, error: orderError } = await supabase.from("orders").insert([orderData]).select().single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        ebook_id: item.ebook_id,
        quantity: item.quantity,
        price: item.products?.price || item.ebooks?.price || 0,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Initialize Paystack payment
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          amount: finalTotal,
          orderId: order.id,
          metadata: {
            user_id: user?.id,
            order_id: order.id,
            items: items.map(item => ({
              product_id: item.product_id,
              ebook_id: item.ebook_id,
              quantity: item.quantity,
              price: item.products?.price || item.ebooks?.price || 0,
            }))
          }
        }),
      })

      const paymentData = await response.json()

      if (!paymentData.success) {
        throw new Error(paymentData.error || 'Failed to initialize payment')
      }

      // Redirect to Paystack payment page
      window.location.href = paymentData.data.authorization_url
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast.error(error.message || "Checkout failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-lg text-muted-foreground">Securing your session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="bg-background">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Checkout</h1>
              <p className="text-muted-foreground">Securely complete your order</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              {!isAllEbooksFree && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <Card className="bg-card border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Shipping Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Full Name *</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              name="fullName"
                              value={formData.fullName}
                              onChange={handleInputChange}
                              placeholder="Enter your full name"
                              className="pl-10 bg-background"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Email Address *</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="Enter your email"
                              className="pl-10 bg-background"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Phone Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+234 XXX XXX XXXX"
                            className="pl-10 bg-background"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Address *</label>
                        <Textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Enter your full address"
                          rows={3}
                          className="bg-background resize-none"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">City *</label>
                          <Input
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="Enter city"
                            className="bg-background"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">State *</label>
                          <select
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-black"
                            required
                          > 
                            <option value="">Select State</option>
                            <option value="Kwara">Kwara</option>
                            <option value="Lagos">Lagos</option>
                            <option value="Abuja">Abuja</option>
                            <option value="Oyo">Oyo</option>
                            <option value="Osun">Osun</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Payment Method */}
              {!isAllEbooksFree && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="bg-card border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-6 w-6 text-primary" />
                          <div>
                            <p className="font-semibold">Pay with Paystack</p>
                            <p className="text-sm text-muted-foreground">
                              Securely pay with Card, Bank Transfer, USSD, or OPay.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Lock className="h-4 w-4" />
                        Your payment information is secure and encrypted.
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-card border sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          {item.product_id ? (
                            item.products?.image_url ? (
                              <Image
                                src={item.products.image_url || "/placeholder.svg"}
                                alt={item.products.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-muted-foreground" />
                            )
                          ) : item.ebook_id ? (
                            item.ebooks?.cover_image_url ? (
                              <Image
                                src={item.ebooks.cover_image_url || "/placeholder.svg"}
                                alt={item.ebooks.title}
                                width={48}
                                height={48}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-muted-foreground" />
                            )
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.products?.name || item.ebooks?.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity} × ₦{(item.products?.price || item.ebooks?.price || 0).toLocaleString()}
                          </p>
                        </div>
                        <p className="font-semibold">₦{((item.products?.price || item.ebooks?.price || 0) * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₦{totalPrice.toLocaleString()}</span>
                    </div>
                    {!isAllEbooksFree && (
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>₦{deliveryFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">₦{finalTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button onClick={handleCheckout} disabled={isProcessing} className="w-full" size="lg">
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        {isAllEbooksFree ? "Get E-books" : `Complete Order - ₦${finalTotal.toLocaleString()}`}
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-muted-foreground text-center">
                    By completing your order, you agree to our Terms of Service and Privacy Policy
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
