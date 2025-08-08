"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, ArrowRight, Shield } from "lucide-react"
import toast from "react-hot-toast"

const securityQuestions = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite book?",
  "What city were you born in?",
  "What was your childhood nickname?",
  "What is the name of your best friend from childhood?",
  "What was your first car model?",
]

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [securityData, setSecurityData] = useState({
    question1: "",
    answer1: "",
    question2: "",
    answer2: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signupMethod, setSignupMethod] = useState<"manual" | "oauth" | null>(null)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSecurityChange = (field: string, value: string) => {
    setSecurityData({
      ...securityData,
      [field]: value,
    })
  }

  const handleNextStep = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setStep(2)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!securityData.question1 || !securityData.answer1 || !securityData.question2 || !securityData.answer2) {
      toast.error("Please complete all security questions")
      setLoading(false)
      return
    }

    if (securityData.question1 === securityData.question2) {
      toast.error("Please select different security questions")
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          securityQuestions: {
            question1: securityData.question1,
            answer1: securityData.answer1,
            question2: securityData.question2,
            answer2: securityData.answer2,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed')
      }

      toast.success(result.message || "Account created successfully! Please check your email to verify your account.")
      router.push("/auth/login")
    } catch (error: any) {
      toast.error(error.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || "Google signup failed")
    }
  }

  const handleFacebookSignup = () => {
    toast("Facebook signup coming soon!")
  }

  if (!signupMethod) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-lg bg-transparent flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  <img
                    src="/logo.png"
                    alt="Sm@rtz Global Logo"
                    className="h-16 w-16 sm:h-12 sm:w-12 object-contain"
                  />
                </span>
              </div>
              </div>
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>Choose how you'd like to sign up</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setSignupMethod("manual")} className="w-full" size="lg">
                <Mail className="h-4 w-4 mr-2" />
                Sign up with Email
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t mb-6" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={handleGoogleSignup} disabled>
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" onClick={handleFacebookSignup} disabled>
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <button
            onClick={() => (step === 1 ? setSignupMethod(null) : setStep(1))}
            className="inline-flex items-center text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-lg bg-transparent flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  <img
                    src="/logo.png"
                    alt="Sm@rtz Global Logo"
                    className="h-16 w-16 sm:h-12 sm:w-12 object-contain"
                  />
                </span>
              </div>
            </div>
            <CardTitle className="text-2xl">{step === 1 ? "Create Account" : "Security Questions"}</CardTitle>
            <CardDescription>
              {step === 1
                ? "Enter your details to create an account"
                : "Set up security questions for account recovery"}
            </CardDescription>
            <div className="flex items-center justify-center mt-4">
              <div className="flex space-x-2">
                <div className={`w-3 h-3 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
                <div className={`w-3 h-3 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleNextStep()
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              ) : (
                <form
                  onSubmit={handleSignup}
                  className="space-y-4"
                >
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Security Questions</span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      These questions will help you recover your account if you forget your password.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Security Question 1</label>
                    <select
                      value={securityData.question1}
                      onChange={(e) => handleSecurityChange("question1", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-black"
                      required
                    >
                      <option value="">Select a question</option>
                      {securityQuestions.map((question, index) => (
                        <option key={index} value={question}>
                          {question}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="text"
                      placeholder="Your answer"
                      value={securityData.answer1}
                      onChange={(e) => handleSecurityChange("answer1", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Security Question 2</label>
                    <select
                      value={securityData.question2}
                      onChange={(e) => handleSecurityChange("question2", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-black"
                      required
                    >
                      <option value="">Select a question</option>
                      {securityQuestions
                        .filter((q) => q !== securityData.question1)
                        .map((question, index) => (
                          <option key={index} value={question}>
                            {question}
                          </option>
                        ))}
                    </select>
                    <Input
                      type="text"
                      placeholder="Your answer"
                      value={securityData.answer2}
                      onChange={(e) => handleSecurityChange("answer2", e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              )}
            </AnimatePresence>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
