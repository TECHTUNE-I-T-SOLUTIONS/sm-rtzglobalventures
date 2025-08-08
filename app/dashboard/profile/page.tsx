"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useAuthStore } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Camera, 
  Save, 
  Eye, 
  EyeOff,
  Shield,
  Settings,
  Activity,
  CreditCard,
  ShoppingBag,
  Heart,
  FileText,
  Bell,
  Lock,
  Key,
  Trash2,
  Download,
  Share2,
  Edit3,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Award,
  TrendingUp,
  DollarSign,
  Package,
  MessageCircle,
  Settings2,
  UserCheck,
  Globe,
  Smartphone,
  Building,
  Home,
  Briefcase,
  GraduationCap,
  Palette,
  Moon,
  Sun,
  Languages,
  Volume2,
  Wifi,
  Zap,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { storage, type UserPreferences } from "@/lib/storage"
import { useTheme } from "next-themes"

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  phone: string | null
  address: any | null
  created_at: string
  updated_at: string
}

interface AccountStats {
  totalOrders: number
  totalSpent: number
  wishlistItems: number
  reviews: number
  lastOrderDate: string | null
  favoriteCategory: string | null
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [accountStats, setAccountStats] = useState<AccountStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [securityQuestions, setSecurityQuestions] = useState({
    question1: "",
    answer1: "",
    question2: "",
    answer2: "",
  })
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const storedPrefs = storage.getPreferences()
    return {
      ...storedPrefs,
      darkMode: resolvedTheme === "dark"
    }
  })
  const [showExportData, setShowExportData] = useState(false)
  const [showShareProfile, setShowShareProfile] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchAccountStats()
      fetchSecurityQuestions()
    }
  }, [user])

  // Sync preferences with theme when theme changes
  useEffect(() => {
    if (resolvedTheme) {
      const newPreferences = {
        ...preferences,
        darkMode: resolvedTheme === "dark"
      }
      setPreferences(newPreferences)
      storage.updatePreference("darkMode", resolvedTheme === "dark")
    }
  }, [resolvedTheme])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAccountStats = async () => {
    if (!user) return

    try {
      // Fetch orders
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .eq("user_id", user.id)

      // Fetch wishlist items
      const { data: wishlistItems } = await supabase
        .from("wishlist_items")
        .select("products(category)")
        .eq("user_id", user.id)

      // Calculate stats
      const totalOrders = orders?.length || 0
      const totalSpent = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      const wishlistCount = wishlistItems?.length || 0
      const lastOrder = orders?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      
      // Get favorite category
      const categories = wishlistItems
        ?.flatMap(item => Array.isArray(item.products) ? item.products.map(product => product.category) : [])
        .filter(Boolean)
      const favoriteCategory = categories?.length ? 
        categories.sort((a, b) => 
          categories.filter(v => v === a).length - categories.filter(v => v === b).length
        ).pop() : null

      setAccountStats({
        totalOrders,
        totalSpent,
        wishlistItems: wishlistCount,
        reviews: 0, // Placeholder
        lastOrderDate: lastOrder?.created_at || null,
        favoriteCategory,
      })
    } catch (error) {
      console.error("Error fetching account stats:", error)
    }
  }

  const fetchSecurityQuestions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("security_questions")
        .select("question_1, answer_1, question_2, answer_2")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore error if no questions are found
        throw error;
      }

      if (data) {
        setSecurityQuestions({
          question1: data.question_1 || "",
          answer1: data.answer_1 || "",
          question2: data.question_2 || "",
          answer2: data.answer_2 || "",
        });
      }
    } catch (error) {
      console.error("Error fetching security questions:", error);
      toast.error("Could not fetch security questions.");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
        })
        .eq("id", profile.id)

      if (error) throw error
      toast.success("Profile updated successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      toast.success("Password updated successfully!")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setShowPasswordForm(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to update password")
    }
  }

  const handleSecurityQuestions = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase
        .from("security_questions")
        .upsert({
          user_id: user?.id,
          question_1: securityQuestions.question1,
          answer_1: securityQuestions.answer1,
          question_2: securityQuestions.question2,
          answer_2: securityQuestions.answer2,
        })

      if (error) throw error
      toast.success("Security questions updated successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to update security questions")
    }
  }

  const handlePreferencesUpdate = async () => {
    try {
      storage.savePreferences(preferences)
      toast.success("Preferences saved successfully!")
    } catch (error: any) {
      toast.error("Failed to save preferences")
    }
  }

  const handleExportData = async () => {
    try {
      const userData = {
        profile,
        accountStats,
        preferences,
        exportDate: new Date().toISOString(),
      }
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sm@rtz-profile-${user?.id}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success("Data exported successfully!")
      setShowExportData(false)
    } catch (error: any) {
      toast.error("Failed to export data")
    }
  }

  const handleShareProfile = async () => {
    try {
      const profileUrl = `${window.location.origin}/profile/${user?.id}`
      
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.full_name || 'User'}'s Profile`,
          text: `Check out ${profile?.full_name || 'this user'}'s profile on Sm@rtz Global Enterprise`,
          url: profileUrl,
        })
      } else {
        await navigator.clipboard.writeText(profileUrl)
        toast.success("Profile link copied to clipboard!")
      }
      
      setShowShareProfile(false)
    } catch (error: any) {
      toast.error("Failed to share profile")
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // Delete user data from Supabase
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user?.id)

      if (profileError) throw profileError

      // Delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user?.id || '')

      if (authError) throw authError

      toast.success("Account deleted successfully!")
      // Redirect to home page
      window.location.href = '/'
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!profile) return

    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    })
  }

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSecurityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecurityQuestions({
      ...securityQuestions,
      [e.target.name]: e.target.value,
    })
  }

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    const newPreferences = {
      ...preferences,
      [key]: value,
    }
    setPreferences(newPreferences)
    storage.updatePreference(key, value)
    
    // Sync dark mode with the actual theme system
    if (key === "darkMode") {
      setTheme(value ? "dark" : "light")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-card border">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                  </div>
                </CardContent>
              </Card>
              <div className="lg:col-span-2">
                <Card className="bg-card border">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-10 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
            <p className="text-muted-foreground">Unable to load your profile information.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
                <User className="h-8 w-8 text-purple-500" />
                Profile Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your account information and preferences
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </Badge>
            </div>
          </div>

          {/* Account Stats */}
          {accountStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Orders", value: accountStats.totalOrders, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
                { label: "Total Spent", value: `₦${accountStats.totalSpent.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
                { label: "Wishlist Items", value: accountStats.wishlistItems, icon: Heart, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
                { label: "Reviews", value: accountStats.reviews, icon: Star, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className={`${stat.bg} border-0 shadow-sm hover:shadow-md transition-shadow`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                          <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.bg}`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture & Basic Info */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Card className="bg-card border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Picture
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full flex items-center justify-center mx-auto overflow-hidden">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url || "/placeholder.svg"}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-purple-500" />
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-lg">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{profile.full_name || "No name set"}</h3>
                    <p className="text-muted-foreground">{profile.email}</p>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Member since {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                    {accountStats?.lastOrderDate && (
                      <div className="flex items-center justify-center gap-1">
                        <Package className="h-4 w-4" />
                        Last order: {new Date(accountStats.lastOrderDate).toLocaleDateString()}
                      </div>
                    )}
                    {accountStats?.favoriteCategory && (
                      <div className="flex items-center justify-center gap-1">
                        <Heart className="h-4 w-4" />
                        Favorite: {accountStats.favoriteCategory}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Profile Tabs */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Preferences
                  </TabsTrigger>
                  <TabsTrigger value="account" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Account
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <Card className="bg-card border shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="full_name" className="block text-sm font-medium mb-2">
                              Full Name
                            </label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="full_name"
                                name="full_name"
                                value={profile.full_name || ""}
                                onChange={handleInputChange}
                                placeholder="Enter your full name"
                                className="pl-10 bg-background"
                              />
                            </div>
                          </div>
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
                                value={profile.email}
                                disabled
                                className="pl-10 bg-muted cursor-not-allowed"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium mb-2">
                              Phone Number
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="phone"
                                name="phone"
                                value={profile.phone || ""}
                                onChange={handleInputChange}
                                placeholder="+234 XXX XXX XXXX"
                                className="pl-10 bg-background"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="role" className="block text-sm font-medium mb-2">
                              Role
                            </label>
                            <div className="relative">
                              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="role"
                                name="role"
                                value={profile.role || "user"}
                                disabled
                                className="pl-10 bg-muted cursor-not-allowed"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="address" className="block text-sm font-medium mb-2">
                            Address
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Textarea
                              id="address"
                              name="address"
                              value={typeof profile.address === 'string' ? profile.address : JSON.stringify(profile.address || {}, null, 2)}
                              onChange={handleInputChange}
                              placeholder="Enter your address (JSON format for structured data)"
                              rows={3}
                              className="pl-10 bg-background resize-none"
                            />
                          </div>
                        </div>

                        <Button type="submit" disabled={saving} className="w-full">
                          {saving ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Saving...
                            </div>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                  <Card className="bg-card border shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                            New Password
                          </label>
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Enter new password"
                            className="bg-background"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                            Confirm New Password
                          </label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Confirm new password"
                            className="bg-background"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          <Key className="h-4 w-4 mr-2" />
                          Update Password
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security Questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSecurityQuestions} className="space-y-4">
                        <div>
                          <label htmlFor="question1" className="block text-sm font-medium mb-2">
                            Security Question 1
                          </label>
                          <Input
                            id="question1"
                            name="question1"
                            value={securityQuestions.question1}
                            onChange={handleSecurityInputChange}
                            placeholder="What was your first pet's name?"
                            className="bg-background"
                          />
                        </div>
                        <div>
                          <label htmlFor="answer1" className="block text-sm font-medium mb-2">
                            Answer 1
                          </label>
                          <Input
                            id="answer1"
                            name="answer1"
                            value={securityQuestions.answer1}
                            onChange={handleSecurityInputChange}
                            placeholder="Your answer"
                            className="bg-background"
                          />
                        </div>
                        <div>
                          <label htmlFor="question2" className="block text-sm font-medium mb-2">
                            Security Question 2
                          </label>
                          <Input
                            id="question2"
                            name="question2"
                            value={securityQuestions.question2}
                            onChange={handleSecurityInputChange}
                            placeholder="What city were you born in?"
                            className="bg-background"
                          />
                        </div>
                        <div>
                          <label htmlFor="answer2" className="block text-sm font-medium mb-2">
                            Answer 2
                          </label>
                          <Input
                            id="answer2"
                            name="answer2"
                            value={securityQuestions.answer2}
                            onChange={handleSecurityInputChange}
                            placeholder="Your answer"
                            className="bg-background"
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          <Shield className="h-4 w-4 mr-2" />
                          Update Security Questions
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences" className="space-y-6">
                  <Card className="bg-card border shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Notification Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">Receive order updates via email</p>
                          </div>
                        </div>
                        <Button
                          variant={preferences.emailNotifications ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePreferenceChange("emailNotifications", !preferences.emailNotifications)}
                        >
                          {preferences.emailNotifications ? "Enabled" : "Disabled"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bell className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">SMS Notifications</p>
                            <p className="text-sm text-muted-foreground">Receive order updates via SMS</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="cursor-not-allowed"
                          >
                            Disabled
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Marketing Emails</p>
                            <p className="text-sm text-muted-foreground">Receive promotional emails</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="cursor-not-allowed"
                          >
                            Disabled
                          </Button>
                        </div>
                      </div>

                      <Button onClick={handlePreferencesUpdate} className="w-full">
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Display Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {resolvedTheme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                          <div>
                            <p className="font-medium">Dark Mode</p>
                            <p className="text-sm text-muted-foreground">Toggle dark/light theme</p>
                          </div>
                        </div>
                        <Button
                          variant={resolvedTheme === "dark" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePreferenceChange("darkMode", resolvedTheme !== "dark")}
                          disabled={!resolvedTheme}
                        >
                          {resolvedTheme === "dark" ? "Dark" : "Light"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Account Tab */}
                <TabsContent value="account" className="space-y-6">
                  <Card className="bg-card border shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Account Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setShowExportData(true)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setShowShareProfile(true)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Profile
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <Button variant="outline" className="w-full" disabled>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Verify Account
                          </Button>
                          <Badge 
                            variant="secondary" 
                            className="absolute -top-2 -right-2 text-xs"
                          >
                            Coming Soon
                          </Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full text-red-600 hover:text-red-700"
                          onClick={() => setShowDeleteAccount(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Account Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Email Verification</span>
                        <Badge 
                          variant="secondary" 
                          className={user?.email_confirmed_at ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                        >
                          {user?.email_confirmed_at ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Phone Verification</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                          <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Account Status</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data."
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="destructive"
      />

      <ConfirmationModal
        isOpen={showExportData}
        onClose={() => setShowExportData(false)}
        onConfirm={handleExportData}
        title="Export Data"
        message="This will download a JSON file containing all your profile data, account statistics, and preferences."
        confirmText="Export Data"
        cancelText="Cancel"
      />

      <ConfirmationModal
        isOpen={showShareProfile}
        onClose={() => setShowShareProfile(false)}
        onConfirm={handleShareProfile}
        title="Share Profile"
        message="This will share your profile link or copy it to your clipboard."
        confirmText="Share Profile"
        cancelText="Cancel"
      />
    </div>
  )
}
