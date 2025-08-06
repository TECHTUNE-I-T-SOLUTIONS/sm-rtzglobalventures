"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import {
  Settings,
  Shield,
  Bell,
  User,
  Mail,
  Phone,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  Database,
  Palette,
  Globe,
} from "lucide-react"
import { motion } from "framer-motion"
import toast from "react-hot-toast"

interface AdminSettings {
  general: {
    siteName: string
    siteDescription: string
    adminEmail: string
    supportPhone: string
    timezone: string
    currency: string
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    passwordMinLength: number
    requireStrongPassword: boolean
  }
  notifications: {
    emailNotifications: boolean
    orderNotifications: boolean
    paymentNotifications: boolean
    disputeNotifications: boolean
    marketingEmails: boolean
  }
  appearance: {
    theme: "light" | "dark" | "system"
    primaryColor: string
    sidebarCollapsed: boolean
    compactMode: boolean
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>({
    general: {
      siteName: "Sm@rtz Global Enterprise",
      siteDescription: "Your trusted partner for quality products and services",
      adminEmail: "admin@smartzglobal.com",
      supportPhone: "+234 123 456 7890",
      timezone: "Africa/Lagos",
      currency: "NGN",
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      passwordMinLength: 8,
      requireStrongPassword: true,
    },
    notifications: {
      emailNotifications: true,
      orderNotifications: true,
      paymentNotifications: true,
      disputeNotifications: true,
      marketingEmails: false,
    },
    appearance: {
      theme: "system",
      primaryColor: "#3b82f6",
      sidebarCollapsed: false,
      compactMode: false,
    },
  })
  const [loading, setLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const saveSettings = async () => {
    try {
      setLoading(true)
      // In a real app, you would save to database
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success("Settings saved successfully")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match")
      return
    }

    if (newPassword.length < settings.security.passwordMinLength) {
      toast.error(`Password must be at least ${settings.security.passwordMinLength} characters`)
      return
    }

    try {
      setLoading(true)
      // In a real app, you would update the password
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (section: keyof AdminSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your admin panel preferences</p>
        </div>
        <Button onClick={saveSettings} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.general.siteName}
                onChange={(e) => updateSetting("general", "siteName", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.general.siteDescription}
                onChange={(e) => updateSetting("general", "siteDescription", e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={settings.general.adminEmail}
                  onChange={(e) => updateSetting("general", "adminEmail", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="supportPhone">Support Phone</Label>
                <Input
                  id="supportPhone"
                  value={settings.general.supportPhone}
                  onChange={(e) => updateSetting("general", "supportPhone", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={settings.general.timezone}
                  onChange={(e) => updateSetting("general", "timezone", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-black mt-1"
                >
                  <option value="Africa/Lagos">Africa/Lagos</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={settings.general.currency}
                  onChange={(e) => updateSetting("general", "currency", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-black mt-1"
                >
                  <option value="NGN">NGN (₦)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch
                checked={settings.security.twoFactorEnabled}
                onCheckedChange={(checked) => updateSetting("security", "twoFactorEnabled", checked)}
              />
            </div>
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => updateSetting("security", "sessionTimeout", parseInt(e.target.value))}
                className="mt-1"
                min="5"
                max="480"
              />
            </div>
            <div>
              <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                value={settings.security.passwordMinLength}
                onChange={(e) => updateSetting("security", "passwordMinLength", parseInt(e.target.value))}
                className="mt-1"
                min="6"
                max="20"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Strong Password</Label>
                <p className="text-sm text-muted-foreground">Include uppercase, lowercase, numbers, and symbols</p>
              </div>
              <Switch
                checked={settings.security.requireStrongPassword}
                onCheckedChange={(checked) => updateSetting("security", "requireStrongPassword", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                checked={settings.notifications.emailNotifications}
                onCheckedChange={(checked) => updateSetting("notifications", "emailNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Order Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified of new orders</p>
              </div>
              <Switch
                checked={settings.notifications.orderNotifications}
                onCheckedChange={(checked) => updateSetting("notifications", "orderNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Payment Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified of payment updates</p>
              </div>
              <Switch
                checked={settings.notifications.paymentNotifications}
                onCheckedChange={(checked) => updateSetting("notifications", "paymentNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Dispute Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified of customer disputes</p>
              </div>
              <Switch
                checked={settings.notifications.disputeNotifications}
                onCheckedChange={(checked) => updateSetting("notifications", "disputeNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">Receive promotional emails</p>
              </div>
              <Switch
                checked={settings.notifications.marketingEmails}
                onCheckedChange={(checked) => updateSetting("notifications", "marketingEmails", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                value={settings.appearance.theme}
                onChange={(e) => updateSetting("appearance", "theme", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-black mt-1"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="primaryColor"
                  type="color"
                  value={settings.appearance.primaryColor}
                  onChange={(e) => updateSetting("appearance", "primaryColor", e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings.appearance.primaryColor}
                  onChange={(e) => updateSetting("appearance", "primaryColor", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Compact Mode</Label>
                <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
              </div>
              <Switch
                checked={settings.appearance.compactMode}
                onCheckedChange={(checked) => updateSetting("appearance", "compactMode", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Change */}
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative mt-1">
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <Button onClick={changePassword} disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
            <Key className="h-4 w-4 mr-2" />
            {loading ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Version</p>
              <p className="font-semibold">v1.0.0</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="font-semibold">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Database</p>
              <p className="font-semibold">PostgreSQL</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant="outline" className="text-green-600">Online</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 