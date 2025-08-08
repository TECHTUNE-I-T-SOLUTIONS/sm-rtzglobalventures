"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CustomerSupportChat } from "@/components/customer-support/chat"
import { MessageCircle, Phone, Mail, Clock, HelpCircle, Search, BookOpen, Headphones, Users, Zap } from "lucide-react"
import { motion } from "framer-motion"
import toast from "react-hot-toast"

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showChat, setShowChat] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    priority: "medium",
  })

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the form data to your backend
    toast.success("Support ticket submitted successfully!")
    setContactForm({
      name: "",
      email: "",
      subject: "",
      message: "",
      priority: "medium",
    })
  }

  const faqItems = [
    {
      question: "How do I track my order?",
      answer:
        "You can track your order by logging into your account and visiting the Orders section, or by using the tracking number sent to your email.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, debit cards, bank transfers, and mobile money payments including Paystack and OPay.",
    },
    {
      question: "How long does delivery take?",
      answer:
        "Delivery typically takes 2-5 business days within Lagos and 3-7 business days for other locations in Nigeria.",
    },
    {
      question: "Can I return or exchange items?",
      answer:
        "Yes, we offer a 30-day return policy for most items. Items must be in original condition with tags attached.",
    },
    {
      question: "Do you offer business services?",
      answer:
        "Yes, we provide comprehensive business services including IT consulting, equipment procurement, and custom solutions.",
    },
    {
      question: "How do I create an account?",
      answer:
        "Click on 'Sign Up' in the top right corner and fill in your details. You'll receive a confirmation email to activate your account.",
    },
  ]

  const supportChannels = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      action: "Start Chat",
      onClick: () => window.open("/dashboard/services"),
      available: true,
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "+234 815 664 5378",
      action: "Call Now",
      onClick: () => window.open("tel:+2348156645378"),
      available: true,
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "printatsmartz@gmail.com",
      action: "Send Email",
      onClick: () => window.open("mailto:printatsmartz@gmail.com"),
      available: true,
    },
    {
      icon: Clock,
      title: "Business Hours",
      description: "Mon-Fri: 6AM-6PM WAT",
      action: "View Schedule",
      onClick: () => {},
      available: false,
    },
  ]

  const filteredFAQ = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Headphones className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Customer Support</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're here to help! Get support, find answers, or contact our team.
            </p>
          </motion.div>
        </div>

        {/* Support Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {supportChannels.map((channel, index) => (
            <motion.div
              key={channel.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card
                className={`h-full transition-all duration-300 ${
                  channel.available ? "hover:shadow-lg cursor-pointer" : "opacity-75"
                }`}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <channel.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{channel.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{channel.description}</p>
                  <Button
                    variant={channel.available ? "default" : "secondary"}
                    size="sm"
                    onClick={channel.onClick}
                    disabled={!channel.available}
                    className="w-full"
                  >
                    {channel.action}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search FAQ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredFAQ.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{item.question}</h4>
                      <p className="text-sm text-muted-foreground">{item.answer}</p>
                    </div>
                  ))}
                  {filteredFAQ.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No FAQ items found matching your search.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Support
                </CardTitle>
                <p className="text-sm text-muted-foreground">Can't find what you're looking for? Send us a message.</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Name
                      </label>
                      <Input
                        id="name"
                        type="text"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium mb-2">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={contactForm.priority}
                      onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe your issue or question..."
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Community Forum</h3>
                  <p className="text-sm text-muted-foreground mb-3">Connect with other users and share experiences</p>
                  <Button variant="outline" size="sm" disabled>
                    Visit Forum
                  </Button>
                </div>
                <div className="text-center">
                  <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Knowledge Base</h3>
                  <p className="text-sm text-muted-foreground mb-3">Detailed guides and tutorials</p>
                  <Button variant="outline" size="sm" onClick={() => window.open("/products/books")}>
                    Browse Articles
                  </Button>
                </div>
                <div className="text-center">
                  <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Status Page</h3>
                  <p className="text-sm text-muted-foreground mb-3">Check system status and updates</p>
                  <Button variant="outline" size="sm" disabled>
                    View Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Live Chat Component
      {showChat && (
        <div className="fixed bottom-4 right-4 z-50">
          <CustomerSupportChat onClose={() => setShowChat(false)} />
        </div>
      )} */}
    </div>
  )
}
