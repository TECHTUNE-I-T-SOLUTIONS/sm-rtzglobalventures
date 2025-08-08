"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Target, Eye, Heart, Users, Zap, Monitor, BookOpen, Building2 } from "lucide-react"
import Image from "next/image"

const values = [
  {
    icon: Target,
    title: "Excellence",
    description: "We strive for excellence in every product and service we deliver",
  },
  {
    icon: Heart,
    title: "Customer First",
    description: "Our customers are at the heart of everything we do",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We embrace technology and innovation to serve you better",
  },
  {
    icon: Users,
    title: "Community",
    description: "We're committed to supporting the community",
  },
]

const subsidiaries = [
  {
    icon: Monitor,
    name: "Sm@rtz Computers",
    description: "Your trusted source for computer accessories, chargers, cables, and tech solutions",
    features: ["Computer Accessories", "Chargers & Cables", "Tech Support", "Online Ordering"],
  },
  {
    icon: BookOpen,
    name: "Sm@rtz Bookshop",
    description: "Comprehensive collection of academic books and educational materials",
    features: ["Academic Textbooks", "Literature Collection", "Educational Materials", "Student Discounts"],
  },
  {
    icon: Building2,
    name: "Business Center",
    description: "Professional document services for students, lecturers and professionals",
    features: ["Document Printing", "Project Analysis", "Editing Services", "Consultation"],
  },
]

const timeline = [
  {
    year: "2016",
    title: "Foundation",
    description: "Sm@rtz Global Enterprise was founded with a vision to serve the University of Ilorin community",
  },
  {
    year: "2016",
    title: "First Subsidiary",
    description: "Launched Sm@rtz Computers, providing essential tech accessories to students",
  },
  {
    year: "2016",
    title: "Business Center",
    description: "Opened our Business Center offering professional document services",
  },
  {
    year: "2023",
    title: "Expansion",
    description: "Added Sm@rtz Bookshop to serve the academic literature needs of students",
  },
  {
    year: "2025",
    title: "Digital Platform",
    description: "Launched our comprehensive e-commerce platform for seamless online shopping",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge variant="secondary" className="mb-4">
              About Us
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Empowering Students Through <span className="text-primary">Digital Solutions</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Since our inception, Sm@rtz Global Enterprise has been dedicated to providing comprehensive digital
              solutions to the University of Ilorin community and beyond.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className="h-full bg-card border">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Our Mission</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    To empower students and professionals with accessible, high-quality digital solutions that enhance
                    their academic and professional journey. We strive to bridge the gap between technology and
                    education by providing essential products and services that support learning and growth.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className="h-full bg-card border">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Eye className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Our Vision</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    To become the leading digital solutions provider in Nigeria's educational sector, recognized for
                    innovation, reliability, and exceptional customer service. We envision a future where every student
                    has access to the tools and resources they need to succeed in their academic pursuits.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These values guide everything we do and shape our commitment to serving our community
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center h-full bg-card border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                      <value.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CEO Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Leadership</h2>
            <p className="text-muted-foreground">Meet the visionary behind Sm@rtz Global Enterprise</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-card border">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                  <div className="lg:col-span-1">
                    <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-primary/80 to-primary/30">
                      <Image
                        src="/smart.png?height=200&width=200"
                        alt="Eneji Daniel Moses"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="lg:col-span-2 text-center lg:text-left">
                    <h3 className="text-2xl font-bold mb-2">Eneji Daniel Moses</h3>
                    <p className="text-primary font-semibold mb-4">Chief Executive Officer</p>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      "Our journey began with a simple vision: to make quality digital solutions accessible to everybody
                      (including students). Today, Sm@rtz Global Enterprise stands as a testament to what's possible when innovation
                      is combined with dedication. We're not just a business; we're a partner in your academic and professional
                      success."
                    </p>
                    <div className="flex items-center justify-center lg:justify-start gap-4">
                      <Badge variant="secondary">Entrepreneur</Badge>
                      <Badge variant="secondary">Enthusiast</Badge>
                      <Badge variant="secondary">Education Advocate</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Subsidiaries Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Our Subsidiaries</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three specialized divisions working together to serve your every need
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {subsidiaries.map((subsidiary, index) => (
              <motion.div
                key={subsidiary.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <Card className="h-full bg-card border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <subsidiary.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold">{subsidiary.name}</h3>
                    </div>
                    <p className="text-muted-foreground mb-6">{subsidiary.description}</p>
                    <div className="space-y-2">
                      {subsidiary.features.map((feature) => (
                        <div key={feature} className="flex items-center text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Our Journey</h2>
            <p className="text-muted-foreground">Key milestones in our growth story</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20"></div>

              <div className="space-y-12">
                {timeline.map((item, index) => (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative flex items-start gap-8"
                  >
                    <div className="relative z-10 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      {item.year}
                    </div>
                    <div className="flex-1 pb-8">
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Our Impact in Numbers</h2>
            <p className="text-primary-foreground/80">These numbers reflect our commitment to serving our community</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10,000+", label: "Happy Students Served" },
              { value: "5,000+", label: "Projects Completed" },
              { value: "2", label: "Service Locations" },
              { value: "4.9/5", label: "Customer Rating" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-foreground/80 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
