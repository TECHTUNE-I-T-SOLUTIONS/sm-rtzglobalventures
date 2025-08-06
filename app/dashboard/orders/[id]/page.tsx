"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/hooks/use-auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  AlertCircle,
  Loader2,
  ClipboardCopy,
  Info,
} from "lucide-react"
import Image from "next/image"
import toast from "react-hot-toast"

type OrderItem = {
  id: string
  quantity: number
  price: number
  products: {
    name: string
    image_url: string
  }
}

// This defines the structure of the shipping address, whether it's a JSON object or a string.
type ShippingAddress = 
  | {
      address: string
      city: string
      state: string
    }
  | string

type Order = {
  id: string
  created_at: string
  updated_at: string
  total_amount: number
  status: string
  payment_status: string
  payment_method: string
  payment_reference: string | null
  payment_provider: string | null
  shipping_address: ShippingAddress
  order_items: OrderItem[]
  profiles: {
    full_name: string
    email: string
    phone: string
  }
}

export default function OrderDetailsPage() {
  const { id: orderId } = useParams()
  const { user } = useAuthStore()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user || !orderId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
            id,
            created_at,
            updated_at,
            total_amount,
            status,
            payment_status,
            payment_method,
            payment_reference,
            payment_provider,
            shipping_address,
            order_items (
              id,
              quantity,
              price,
              products (
                name,
                image_url
              )
            ),
            profiles (
              full_name,
              email,
              phone
            )
          `
          )
          .eq("id", orderId)
          .eq("user_id", user.id)
          .single()

        if (error) {
          throw new Error("Order not found or you do not have permission to view it.")
        }

        if (data) {
          setOrder(data as Order)
        }
      } catch (err: any) {
        setError(err.message)
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, user])

  const handleCopyToClipboard = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard!")
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "delivered":
        return "success"
      case "pending":
      case "processing":
      case "shipped":
        return "warning"
      case "failed":
      case "cancelled":
        return "destructive"
      default:
        return "default"
    }
  }

  const renderShippingAddress = (address: ShippingAddress) => {
    if (typeof address === 'string') {
      try {
        const parsedAddress = JSON.parse(address)
        return (
          <>
            <p>{parsedAddress.address}</p>
            <p>{parsedAddress.city}, {parsedAddress.state}</p>
          </>
        )
      } catch (e) {
        // If it's not a JSON string, display it as is.
        return <p>{address}</p>
      }
    }
    return (
      <>
        <p>{address.address}</p>
        <p>{address.city}, {address.state}</p>
      </>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button variant="secondary" onClick={() => router.push("/dashboard/orders")} className="mt-4">
              Back to Orders
            </Button>
          </Alert>
        </main>
        <Footer />
      </>
    )
  }

  if (!order) {
    return null // Or a 'not found' component
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Order Details</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Order ID: {order.id}</span>
                <ClipboardCopy
                  className="h-4 w-4 cursor-pointer hover:text-primary"
                  onClick={() => handleCopyToClipboard(order.id)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Date</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{new Date(order.updated_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order Status</p>
                  <Badge variant={getStatusVariant(order.status)} className="capitalize">
                    {order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-bold text-lg">₦{order.total_amount.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Items in your order ({order.order_items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Item</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.order_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Image
                            src={item.products.image_url || "/placeholder.svg"}
                            alt={item.products.name}
                            width={64}
                            height={64}
                            className="rounded-md object-cover bg-muted"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.products.name}</TableCell>
                        <TableCell className="text-right">₦{item.price.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Customer and Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">{order.profiles.full_name}</p>
                  <p className="text-muted-foreground">{order.profiles.email}</p>
                  <p className="text-muted-foreground">{order.profiles.phone || "No phone provided"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {renderShippingAddress(order.shipping_address)}
                </CardContent>
              </Card>
            </div>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge variant={getStatusVariant(order.payment_status)} className="capitalize">
                    {order.payment_status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium capitalize">{order.payment_method || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Provider</span>
                  <span className="font-medium capitalize">{order.payment_provider || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Reference</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{order.payment_reference || "N/A"}</span>
                    <ClipboardCopy
                      className="h-4 w-4 cursor-pointer hover:text-primary"
                      onClick={() => handleCopyToClipboard(order.payment_reference || "")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}