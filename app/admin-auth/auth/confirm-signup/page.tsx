"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Mail, CheckCircle, Shield, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

export default function AdminConfirmSignupPage() {
  const [resending, setResending] = useState(false)

  const handleResendEmail = async () => {
    setResending(true)
    try {
      // Get the email from session storage
      const email = sessionStorage.getItem('admin_signup_email')
      
      if (!email) {
        toast.error('Email not found. Please try signing up again.')
        return
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        toast.error(error.message || 'Failed to resend confirmation email')
      } else {
        toast.success('Confirmation email sent successfully!')
      }
    } catch (error: any) {
      toast.error('Failed to resend confirmation email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="bg-card/95 backdrop-blur-sm border shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
              <CardDescription>Sm@rtz Global Ventures</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Confirmation Email Sent
                </span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                We've sent a confirmation email to your email address. Please check your inbox and click the confirmation link to activate your admin account.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">What's Next?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Check your email inbox (and spam folder)</li>
                  <li>• Click the "Confirm Admin Account" button in the email</li>
                  <li>• You'll be redirected to complete your account setup</li>
                  <li>• Then you can log in to the admin dashboard</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button onClick={handleResendEmail} variant="outline" className="w-full" disabled={resending}>
                  {resending ? (
                    <div className="flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Resending...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Confirmation Email
                    </div>
                  )}
                </Button>

                <Button asChild className="w-full">
                  <Link href="/admin-auth/auth/login">
                    <Shield className="h-4 w-4 mr-2" />
                    Go to Admin Login
                  </Link>
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Didn't receive the email?
                  </p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Check your spam folder or click "Resend Confirmation Email" above. The confirmation link expires in 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact IT support at{" "}
            <a href="mailto:printatsmartz@gmail.com" className="text-primary hover:underline">
              printatsmartz@gmail.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
} 