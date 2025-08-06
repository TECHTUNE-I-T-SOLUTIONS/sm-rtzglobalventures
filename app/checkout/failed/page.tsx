"use client"

import { useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, RefreshCw, Home, ShoppingCart } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Suspense } from "react"

function CheckoutFailed() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const error = searchParams.get("error")

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
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
            <p className="text-muted-foreground">
              We're sorry, but your payment could not be processed. Please try again.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-card border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  What Happened?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reference && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Payment Reference</p>
                    <p className="font-semibold">{reference}</p>
                  </div>
                )}
                
                {error && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Error Details</p>
                    <p className="font-semibold text-red-600">{error}</p>
                  </div>
                )}

                <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Common Reasons for Payment Failure:
                  </h3>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Insufficient funds in your account</li>
                    <li>• Incorrect card details</li>
                    <li>• Network connectivity issues</li>
                    <li>• Bank declined the transaction</li>
                    <li>• Payment timeout</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 mt-8"
          >
            <Link href="/cart" className="flex-1">
              <Button className="w-full" variant="outline">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Return to Cart
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Need help? Contact our support team at{" "}
              <a href="mailto:support@smartz.com" className="text-primary hover:underline">
                support@smartz.com
              </a>
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function CheckoutFailedPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CheckoutFailed />
        </Suspense>
    )
}