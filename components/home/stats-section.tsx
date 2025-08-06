"use client"

import { motion } from "framer-motion"
import { Users, ShoppingBag, MapPin, Headphones } from "lucide-react"

const stats = [
  {
    icon: Users,
    value: "10,000+",
    label: "Happy Students",
    description: "Served across University of Ilorin",
  },
  {
    icon: ShoppingBag,
    value: "5,000+",
    label: "Projects Completed",
    description: "Documents printed and edited",
  },
  {
    icon: MapPin,
    value: "2",
    label: "Service Locations",
    description: "Computers, Books, Business Center",
  },
  {
    icon: Headphones,
    value: "24/7",
    label: "Customer Support",
    description: "Always here to help you",
  },
]

export function StatsSection() {
  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Our Impact</h2>
          <p className="text-muted-foreground">Numbers that speak for our commitment</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-lg font-semibold mb-2">{stat.label}</div>
              <p className="text-muted-foreground text-sm">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
