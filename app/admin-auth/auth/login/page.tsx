"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"
import { motion } from "framer-motion"

export default function AdminLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Check if user is already logged in as admin
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        if (profile?.role === "admin") {
          router.push("/admin")
        }
      }
    }
    checkAuth()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          toast.error("Please confirm your email address before logging in. Check your inbox for the confirmation link.")
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error("Invalid email or password. Please try again.")
        } else {
          toast.error(error.message || "Login failed")
        }
        return
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        toast.error("Failed to verify admin privileges")
        return
      }

      if (profile.role !== "admin") {
        await supabase.auth.signOut()
        toast.error("Access denied. Admin privileges required.")
        return
      }

      toast.success("Login successful!")
      router.push("/admin")
    } catch (error: any) {
      console.error("Login error:", error)
      toast.error(error.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      toast.error("Please enter your email address first")
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
              <p className="text-muted-foreground">Sm@rtz Global Ventures</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="admin@smartzglobal.com"
                    className="pl-10 bg-background"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 bg-background"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Signing in...
                  </div>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Sign In as Admin
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-4 flex flex-col items-center gap-2 text-sm">
              <span>
                Don't have an account?{" "}
                <a href="./signup" className="text-primary hover:underline">
                  Sign up
                </a>
              </span>
              <span>
                <a href="./forgot-password" className="text-primary hover:underline">
                  Forgot password?
                </a>
              </span>
            </div>

            {/* <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Email not confirmed?
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 mb-2">
                    If you haven't received a confirmation email, click the button below to resend it.
                  </p>
                  <Button 
                    onClick={handleResendConfirmation} 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    Resend Confirmation Email
                  </Button>
                </div>
              </div>
            </div> */}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Authorized personnel only. All access is monitored and logged.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact IT support at{" "}
            <a href="mailto:it@smartzglobal.com" className="text-primary hover:underline">
              it@smartzglobal.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
