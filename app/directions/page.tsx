"use client"

import dynamic from "next/dynamic"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false })

export default function DirectionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Our Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Shop 4 & 5, Behind Faculty of CIS, University of Ilorin PS, Ilorin, Nigeria
            </p>
            <MapView />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}