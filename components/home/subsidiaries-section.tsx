"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Monitor, BookOpen, Building2, ArrowRight } from "lucide-react"
import Link from "next/link"

const subsidiaries = [
  {
    icon: Monitor,
    name: "Sm@rtz Computers",
    description: "Premium computer accessories, chargers, cables, and tech solutions for all your digital needs.",
    features: ["Computer Accessories", "Chargers & Cables", "Online Payments", "Fast Delivery"],
    link: "/products/computers",
    color: "bg-blue-500",
  },
  {
    icon: BookOpen,
    name: "Sm@rtz Bookshop",
    description: "Extensive collection of academic books, literature, and educational materials for students.",
    features: ["Academic Books", "Literature Collection", "Educational Materials", "Student Discounts"],
    link: "/products/books",
    color: "bg-green-500",
  },
  {
    icon: Building2,
    name: "Business Center",
    description: "Professional document services including printing, editing, and project analysis for students.",
    features: ["Document Printing", "Project Analysis", "Assignment Editing", "Student Services"],
    link: "/business-center",
    color: "bg-purple-500",
  },
]

export function SubsidiariesSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Our Subsidiaries</h2>
          <p className="text-muted-foreground">Three specialized divisions serving your every need</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {subsidiaries.map((subsidiary, index) => (
            <motion.div
              key={subsidiary.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 group">
                <CardHeader className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 ${subsidiary.color} rounded-full mb-4 mx-auto`}
                  >
                    <subsidiary.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{subsidiary.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-6">{subsidiary.description}</p>

                  <div className="space-y-2 mb-6">
                    {subsidiary.features.map((feature) => (
                      <div key={feature} className="flex items-center justify-center text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Link href={subsidiary.link}>
                    <Button className="w-full group-hover:bg-primary/90">
                      Explore Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
