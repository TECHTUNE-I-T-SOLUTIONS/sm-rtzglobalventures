"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { FileText, Edit3, BarChart3, Printer, Clock, MapPin, Phone, Mail, CheckCircle, Star, Users } from "lucide-react"
import Link from "next/link"

const services = [
  {
    id: "printing",
    title: "Document Printing",
    description: "High-quality printing services for all your academic and professional needs",
    icon: Printer,
    features: ["Black & White Printing", "Color Printing", "Binding Services", "Lamination"],
    price: "From ₦30 per page",
    color: "bg-blue-500",
  },
  {
    id: "editing",
    title: "Document Editing",
    description: "Professional editing and proofreading services for assignments and projects",
    icon: Edit3,
    features: ["Grammar Check", "Structure Review", "Formatting", "Plagiarism Check"],
    price: "From ₦1,000 per document",
    color: "bg-green-500",
  },
  {
    id: "analysis",
    title: "Project Analysis",
    description: "Comprehensive analysis and consultation for your research projects",
    icon: BarChart3,
    features: ["Data Analysis", "Research Guidance", "Statistical Review", "Consultation"],
    price: "From ₦5,000 per project",
    color: "bg-purple-500",
  },
  {
    id: "other",
    title: "Other Services",
    description: "Additional academic and professional services tailored to your needs",
    icon: FileText,
    features: ["CV Writing", "Proposal Writing", "Presentation Design", "Custom Services"],
    price: "Contact for pricing",
    color: "bg-orange-500",
  },
]

const stats = [
  { label: "Projects Completed", value: "10,000+", icon: CheckCircle },
  { label: "Happy Students", value: "10,000+", icon: Users },
  { label: "Average Rating", value: "4.9/5", icon: Star },
  { label: "Response Time", value: "< 2 hours", icon: Clock },
]

export default function BusinessCenterPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null)

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
              Professional Services
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Sm@rtz <span className="text-primary">Business Center</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Your one-stop solution for all academic and professional document services. Located at the heart of
              University of Ilorin, we provide quality services to help students excel in their academic journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Today
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-background">
                View Our Services
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We offer a comprehensive range of academic and professional services designed to support your educational
              and career goals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 bg-card border group">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${service.color}`}>
                        <service.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{service.title}</CardTitle>
                        <CardDescription className="mt-1">{service.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {service.features.map((feature) => (
                        <div key={feature} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="font-semibold text-primary">{service.price}</span>
                      <Link href="/dashboard/services">
                        <Button className="group-hover:bg-primary/90">Request Service</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Contact Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold mb-6">Visit Our Location</h2>
              <Card className="bg-card border">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold">Physical Address</p>
                        <p className="text-muted-foreground">
                          Shop 4 & 5, Behind Faculty of CIS
                          <br />
                          University of Ilorin PS
                          <br />
                          Ilorin, Kwara State, Nigeria
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">Operating Hours</p>
                        <p className="text-muted-foreground">Mon - Fri: 6:00 AM - 6:00 PM</p>
                        <p className="text-muted-foreground">Sat: 9:00 AM - 4:00 PM</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">Phone</p>
                        <p className="text-muted-foreground">+234 815 664 5378</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">Email</p>
                        <p className="text-muted-foreground">printatsmartz@gmail.com</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold mb-6">How It Works</h2>
              <div className="space-y-6">
                {[
                  {
                    step: "1",
                    title: "Create Account",
                    description: "Sign up for free and access our dashboard",
                  },
                  {
                    step: "2",
                    title: "Choose Service",
                    description: "Select the service you need from our offerings",
                  },
                  {
                    step: "3",
                    title: "Upload Documents",
                    description: "Share your files through our secure chat interface",
                  },
                  {
                    step: "4",
                    title: "Get Quote",
                    description: "Receive pricing and timeline from our team",
                  },
                  {
                    step: "5",
                    title: "Complete Service",
                    description: "Get your completed work delivered on time",
                  },
                ].map((item, index) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of students who trust Sm@rtz Business Center for their academic needs. Create your account
              today and experience professional service delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary bg-transparent"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
