import { Suspense } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { EbookSuccessContent } from "@/components/checkout/ebook-success-content"

export default function EbookSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <Suspense fallback={<div>Loading ebook details...</div>}>
        <EbookSuccessContent />
      </Suspense>
      <Footer />
    </div>
  )
}