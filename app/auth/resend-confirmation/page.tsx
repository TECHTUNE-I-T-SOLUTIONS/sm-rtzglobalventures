"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"

export default function ResendConfirmationPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const redirectTo = `${window.location.origin}/auth/login`
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: redirectTo,
        },
      })

      if (error) throw error

      setEmailSent(true)
      toast.success("Confirmation email sent!")
    } catch (error: any) {
      // Don't reveal if an email is actually in the system or not for security.
      // Pretend it was sent successfully even if the user is not found.
      if (error.message.toLowerCase().includes("user not found")) {
        setEmailSent(true)
      } else {
        toast.error(error.message || "Failed to send confirmation email")
      }
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
              <p className="text-muted-foreground mb-6">
                If an account with <strong>{email}</strong> exists and requires confirmation, we've sent a new link to it.
              </p>
              <Link href="/auth/login">
                <Button className="w-full">Back to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-6">
          <Link href="/auth/login" className="inline-flex items-center text-primary hover:text-primary/80">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-lg bg-transparent flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Sm@rtz Global Logo"
                  className="h-16 w-16 sm:h-12 sm:w-12 object-contain"
                />
              </div>
            </div>
            <CardTitle className="text-2xl">Resend Confirmation</CardTitle>
            <CardDescription>Enter your email to receive a new confirmation link.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleResendConfirmation} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Resend Confirmation Email"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
