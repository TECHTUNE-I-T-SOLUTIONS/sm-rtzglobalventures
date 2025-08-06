"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import toast from "react-hot-toast"

function AdminConfirm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check for error parameters first
        const error = searchParams.get('error')
        const errorCode = searchParams.get('error_code')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          setStatus('error')
          if (errorCode === 'otp_expired') {
            setMessage('The confirmation link has expired. Please request a new confirmation email.')
          } else {
            setMessage(errorDescription || 'Confirmation failed. Please try again.')
          }
          return
        }

        // Get the code from URL parameters (Supabase uses 'code' not 'token')
        const code = searchParams.get('code')
        const type = searchParams.get('type')

        if (!code) {
          setStatus('error')
          setMessage('Invalid confirmation link. Please check your email and try again.')
          return
        }

        // Confirm the email using Supabase
        const { error: confirmError } = await supabase.auth.verifyOtp({
          token: code,
          type: type as any || 'signup'
        })

        if (confirmError) {
          console.error('Confirmation error:', confirmError)
          setStatus('error')
          setMessage(confirmError.message || 'Failed to confirm email. Please try again.')
          return
        }

        // Success
        setStatus('success')
        setMessage('Your admin account has been confirmed successfully! You can now log in to the admin dashboard.')
        
        // Show success toast
        toast.success('Admin account confirmed successfully!')
        
      } catch (error: any) {
        console.error('Confirmation error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    handleEmailConfirmation()
  }, [searchParams])

  const handleLogin = () => {
    router.push('/admin-auth/auth/login')
  }

  const handleResend = async () => {
    try {
      const email = searchParams.get('email')
      if (!email) {
        toast.error('Email not found in URL')
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
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              {status === 'loading' && <Loader2 className="h-8 w-8 text-primary animate-spin" />}
              {status === 'success' && <CheckCircle className="h-8 w-8 text-green-600" />}
              {status === 'error' && <AlertCircle className="h-8 w-8 text-red-600" />}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {status === 'loading' && 'Confirming Account...'}
                {status === 'success' && 'Account Confirmed!'}
                {status === 'error' && 'Confirmation Failed'}
              </CardTitle>
              <CardDescription>
                {status === 'loading' && 'Please wait while we confirm your admin account'}
                {status === 'success' && 'Sm@rtz Global Enterprise'}
                {status === 'error' && 'Please try again or contact support'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === 'loading' && (
              <div className="text-center space-y-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Verifying your email address...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Successfully Confirmed
                    </span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Your admin account has been verified and is now active.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You can now access the admin dashboard with your email and password.
                  </p>
                  
                  <Button onClick={handleLogin} className="w-full" size="lg">
                    <Shield className="h-4 w-4 mr-2" />
                    Go to Admin Login
                  </Button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
                      Confirmation Failed
                    </span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {message}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    The confirmation link may have expired or is invalid. 
                    You can request a new confirmation email.
                  </p>
                  
                  <div className="flex space-x-2">
                    <Button onClick={handleResend} variant="outline" className="flex-1">
                      Resend Email
                    </Button>
                    <Button onClick={handleLogin} className="flex-1">
                      Go to Login
                    </Button>
                  </div>
                </div>
              </div>
            )}
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

export default function AdminConfirmPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminConfirm />
    </Suspense>
  )
}