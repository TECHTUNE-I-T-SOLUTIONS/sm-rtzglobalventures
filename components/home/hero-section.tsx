"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShoppingBag, BookOpen, Building2 } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  const features = [
    "Premium Computer Accessories",
    "Extensive Book Collection",
    "Professional Business Services",
    "Fast & Reliable Delivery",
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-gray-900 dark:to-gray-800">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/logo.png?height=1080&width=1920')] opacity-5"></div>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-1 sm:p-6 md:p-4 p-4 m-6 sm:m-4 md:m-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-2"
          >
            <img src="/logo.png" alt="Sm@rtz Global Logo" className="h-40 w-40 object-contain mb-6 mx-auto" />
            <h1 className="text-3xl md:text-7xl sm:text-5xl text-center font-bold mb-6">
              <span className="text-primary">Sm@rtz</span> <span className="text-foreground">Global</span>
              <br />
              <span className="text-2xl md:text-4xl text-muted-foreground">Ventures</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">Your One-Stop Digital Solutions Provider</p>
          </motion.div>

          {/* Rotating Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mb-12"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border"
                >
                  <p className="text-sm font-medium">{feature}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col p-4 ml-4 sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/products/computers">
              <Button size="lg" className="w-full sm:w-auto">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Shop Computers
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/products/books">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Books
              </Button>
            </Link>
            <Link href="/business-center">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                <Building2 className="mr-2 h-5 w-5" />
                Business Services
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
