import { Suspense } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MixedSuccessContent } from "@/components/checkout/mixed-success-content"

export default function MixedSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <Suspense fallback={<div>Loading order details...</div>}>
        <MixedSuccessContent />
      </Suspense>
      <Footer />
    </div>
  )
}
