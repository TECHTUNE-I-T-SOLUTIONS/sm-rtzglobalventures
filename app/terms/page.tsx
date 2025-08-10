"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ShoppingCart, CreditCard, Truck, AlertTriangle, Scale } from "lucide-react"
import { motion } from "framer-motion"

export default function TermsOfServicePage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      icon: FileText,
      content: [
        "By accessing and using our website, you accept and agree to be bound by these Terms of Service",
        "If you do not agree to these terms, please do not use our services",
        "We reserve the right to modify these terms at any time with notice",
        "Continued use of our services constitutes acceptance of modified terms",
      ],
    },
    {
      title: "Products and Services",
      icon: ShoppingCart,
      content: [
        "We offer computer accessories, books, and business services",
        "Product descriptions and prices are subject to change without notice",
        "We reserve the right to limit quantities and discontinue products",
        "All products are subject to availability",
        "Business center services are provided at our physical location",
      ],
    },
    {
      title: "Orders and Payment",
      icon: CreditCard,
      content: [
        "All orders are subject to acceptance and availability",
        "Prices are in Nigerian Naira (₦) and include applicable taxes",
        "Payment is required at the time of order placement",
        "We accept payments through Paystack and OPay",
        "Failed payments may result in order cancellation",
        "Refunds are processed according to our refund policy",
      ],
    },
    {
      title: "Shipping and Delivery",
      icon: Truck,
      content: [
        "Delivery is available within Nigeria, with focus on Ilorin communities",
        "Delivery times are estimates and not guaranteed",
        "Risk of loss passes to you upon delivery",
        "You are responsible for providing accurate delivery information",
        "Additional charges may apply for remote locations",
      ],
    },
    {
      title: "User Responsibilities",
      icon: AlertTriangle,
      content: [
        "You must provide accurate and complete information",
        "You are responsible for maintaining account security",
        "Prohibited uses include fraud, harassment, or illegal activities",
        "You must not interfere with the proper functioning of our website",
        "Respect intellectual property rights of others",
      ],
    },
    {
      title: "Limitation of Liability",
      icon: Scale,
      content: [
        "Our liability is limited to the maximum extent permitted by law",
        "We are not liable for indirect, incidental, or consequential damages",
        "Total liability shall not exceed the amount paid for the specific product or service",
        "We do not warrant uninterrupted or error-free service",
        "Force majeure events are beyond our control and responsibility",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold">Terms of Service</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Please read these terms carefully before using our services. These terms govern your use of our website
              and services.
            </p>
            <p className="text-sm text-muted-foreground mt-4">Last updated: August 2025</p>
          </motion.div>

          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-card border">
              <CardContent className="p-8">
                <p className="text-lg leading-relaxed">
                  Welcome to Sm@rtz Global Ventures. These Terms of Service ("Terms") govern your use of our website
                  and services. By using our services, you agree to comply with and be bound by these terms.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Terms Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <section.icon className="h-6 w-6 text-primary" />
                      </div>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Terms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-8 space-y-8"
          >
            <Card className="bg-card border">
              <CardHeader>
                <CardTitle>Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  All content on our website, including text, graphics, logos, and software, is the property of Sm@rtz
                  Global Ventures or its licensors and is protected by copyright and other intellectual property laws.
                </p>
                <p className="text-muted-foreground">
                  You may not reproduce, distribute, or create derivative works from our content without express written
                  permission.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border">
              <CardHeader>
                <CardTitle>Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of our
                  services, to understand our practices regarding the collection and use of your personal information.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border">
              <CardHeader>
                <CardTitle>Governing Law</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  These Terms are governed by and construed in accordance with the laws of Nigeria. Any disputes arising
                  from these Terms or your use of our services shall be subject to the exclusive jurisdiction of the
                  courts of Nigeria.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    <strong>Sm@rtz Global Ventures</strong>
                  </p>
                  <p className="text-muted-foreground">Shop 4 & 5, Behind Faculty of CIS</p>
                  <p className="text-muted-foreground">University of Ilorin PS, Ilorin, Nigeria</p>
                  <p className="text-muted-foreground">Email: printatsmartz@gmail.com</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
