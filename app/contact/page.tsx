"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, Headphones, Users } from "lucide-react"
import toast from "react-hot-toast"
 
const contactMethods = [
  //Disabled temporarily due to unavailable Google Maps API Key
  {
    icon: MapPin,
    title: "Visit Our Location",
    description: "Shop 4 & 5, Behind Faculty of CIS, University of Ilorin PS, Ilorin, Nigeria",
    action: "/dashboard/services",
    color: "bg-blue-500",
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "+234 815 664 5378",
    action: "Tel:+234 815 664 5378",
    color: "bg-green-500",
  },
  {
    icon: Mail,
    title: "Email Us",
    description: "printatsmartz@gmail.com",
    action: "mailto:printatsmartz@gmail.com", //Corrected the case here
    color: "bg-purple-500",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Chat with our support team",
    action: "Start Chat",
    color: "bg-orange-500",
  },
]

const departments = [
  {
    name: "Sm@rtz Computers",
    email: "printatsmartz@gmail.com",
    description: "Computer accessories and tech support",
  },
  {
    name: "Sm@rtz Bookshop",
    email: "printatsmartz@gmail.com",
    description: "Academic books and literature",
  },
  {
    name: "Business Center",
    email: "printatsmartz@gmail.com",
    description: "Document services and consultation",
  },
  {
    name: "Customer Support",
    email: "printatsmartz@gmail.com",
    description: "General inquiries and support",
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    department: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Message sent successfully! We'll get back to you soon.")
      setFormData({
        name: "",
        email: "",
        subject: "",
        department: "",
        message: "",
      })
    } catch (error) {
      toast.error("Failed to send message. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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
              Contact Us
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Get in <span className="text-primary">Touch</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Have questions or need assistance? We're here to help! Reach out to us through any of the channels below
              and we'll get back to you as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">How to Reach Us</h2>
            <p className="text-muted-foreground">Choose the method that works best for you</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center h-full bg-card border hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 ${method.color} rounded-full mb-4 group-hover:scale-110 transition-transform`} //Corrected case here
                    >
                      <method.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{method.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{method.description}</p>
                    {method.title != "Visit Our Location" ? (
                      method.title === "Live Chat" ? (
                        <a href={method.action}>
                          <Button variant="outline" size="sm" className="bg-background">
                            Live Chat
                          </Button>
                        </a>
                      ) : (
                        <a href={method.action} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="bg-background">
                            {method.title == "Call Us"
                              ? "Call Now"
                              : method.title == "Email Us"
                              ? "Send Email"
                              : method.title}
                          </Button>
                        </a>
                      )
                    ) : (
                      <Button variant="outline" size="sm" className="bg-background" disabled>
                        {method.title}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className="bg-card border">
                <CardHeader>
                  <CardTitle className="text-2xl">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                          Full Name *
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          required
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                          Email Address *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your.email@example.com"
                          required
                          className="bg-background"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="department" className="block text-sm font-medium mb-2">
                        Department
                      </label>
                      <select
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-input rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select a department</option>
                        {departments.map((dept) => (
                          <option key={dept.name} value={dept.name}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-2">
                        Subject *
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What is this about?"
                        required
                        className="bg-background"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us more about your inquiry..."
                        rows={6}
                        required
                        className="bg-background resize-none"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                      {loading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Sending...
                        </div>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Business Hours */}
              <Card className="bg-card border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Business Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-medium">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-medium">9:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-medium text-muted-foreground">Closed</span>
                  </div>
                </CardContent>
              </Card>

              {/* Departments */}
              <Card className="bg-card border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Departments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {departments.map((dept) => (
                    <div key={dept.name} className="border-b border-border last:border-b-0 pb-3 last:pb-0">
                      <h4 className="font-semibold">{dept.name}</h4>
                      <p className="text-sm text-muted-foreground mb-1">{dept.description}</p>
                      <a href={`mailto:${dept.email}`} className="text-sm text-primary hover:underline">
                        {dept.email}
                      </a>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Support */}
              <Card className="bg-card border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="h-5 w-5 text-primary" />
                    Need Immediate Help?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    For urgent matters, use our live chat feature or visit our physical location. Our customer support
                    team is always ready to assist you.
                  </p>

                   <div className="flex gap-3">
                    <a href="/dashboard/services">
                    <Button size="sm" className="mr-4">
                      <MessageSquare className="h-4 w-4 mr-4" />
                      Live Chat
                    </Button>
                    </a>
                    <a href="Tel:+234 815 664 5378">
                      <Button variant="outline" size="sm" className="bg-background">
                        Call Support
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
