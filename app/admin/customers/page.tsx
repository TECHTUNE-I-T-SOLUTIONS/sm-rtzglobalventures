"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Search, Eye, Users, UserCheck, UserX, Mail, Phone, Calendar } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"

interface Customer {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  address: string | null
  date_of_birth: string | null
  role: string
  created_at: string
  last_sign_in_at: string | null
  avatar_url: string | null // Added
  orders_count?: number
  total_spent?: number
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [customers, searchQuery])

  const fetchCustomers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "user")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const customerIds = profiles.map(p => p.id);

      // Fetch last_sign_in_at from the new API route
      const lastSignInResponse = await fetch('/api/admin/users/last-sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: customerIds }),
      });

      if (!lastSignInResponse.ok) {
        throw new Error('Failed to fetch last sign-in dates from API');
      }
      const lastSignInData = await lastSignInResponse.json();
      const lastSignInMap = new Map(lastSignInData.map((user: { id: string; last_sign_in_at: string | null }) => [user.id, user.last_sign_in_at]));

      const customersWithStats = await Promise.all(
        profiles.map(async (profile) => {
          const lastSignInAt = lastSignInMap.get(profile.id) || null;
          const avatarUrl = profile.avatar_url || null; // Use profile.avatar_url directly

          const { data: orders, error: ordersError } = await supabase
            .from("orders")
            .select("total_amount")
            .eq("user_id", profile.id);

          if (ordersError) {
            console.error("Error fetching orders for customer:", ordersError);
            return {
              ...profile,
              last_sign_in_at: lastSignInAt,
              avatar_url: avatarUrl,
              orders_count: 0,
              total_spent: 0,
            };
          }

          return {
            ...profile,
            last_sign_in_at: lastSignInAt,
            avatar_url: avatarUrl,
            orders_count: orders.length,
            total_spent: orders.reduce((sum, order) => sum + order.total_amount, 0),
          };
        }),
      );

      setCustomers(customersWithStats);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers]

    if (searchQuery) {
      filtered = filtered.filter(
        (customer) =>
          customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (customer.full_name && customer.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (customer.phone && customer.phone.includes(searchQuery)),
      )
    }

    setFilteredCustomers(filtered)
  }

  const stats = {
    total: customers.length,
    active: customers.filter((c) => c.last_sign_in_at).length,
    withOrders: customers.filter((c) => (c.orders_count || 0) > 0).length,
    totalRevenue: customers.reduce((sum, customer) => sum + (customer.total_spent || 0), 0),
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Customer Management</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="animate-pulse">
                  <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-6 sm:h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Customer Management</h1>
        <Badge variant="secondary" className="text-xs sm:text-sm">
          {filteredCustomers.length} customers
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">With Orders</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.withOrders}</p>
              </div>
              <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-base sm:text-xl font-bold text-primary">₦{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-card border">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Cards */}
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border rounded-lg p-3 sm:p-4 bg-background flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {customer.avatar_url ? (
                      <img src={customer.avatar_url} alt={customer.full_name || customer.email} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary font-semibold text-sm sm:text-base">
                        {customer.full_name
                          ? customer.full_name.charAt(0).toUpperCase()
                          : customer.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{customer.full_name || "No name set"}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{customer.email}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate">{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{customer.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {customer.orders_count || 0} orders
                  </Badge>
                  <span className="font-semibold text-primary text-xs sm:text-sm">
                    ₦{(customer.total_spent || 0).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Joined: {new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {customer.last_sign_in_at ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="truncate">
                          Active: {new Date(customer.last_sign_in_at).toLocaleDateString()}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                        <span className="truncate">Never Active</span>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedCustomer(customer)}
                  className="w-full text-xs sm:text-sm"
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  View Details
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Details Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-black rounded-lg w-full max-w-[95vw] sm:max-w-lg lg:max-w-2xl max-h-[95vh] overflow-y-auto p-3 sm:p-4 lg:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Customer Details</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
                  <UserX className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Full Name</p>
                        <p className="font-semibold text-sm sm:text-base break-words">
                          {selectedCustomer.full_name || "Not provided"}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Email</p>
                        <p className="font-semibold text-sm sm:text-base break-all">{selectedCustomer.email}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Phone</p>
                        <p className="font-semibold text-sm sm:text-base break-words">
                          {selectedCustomer.phone || "Not provided"}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Date of Birth</p>
                        <p className="font-semibold text-sm sm:text-base break-words">
                          {selectedCustomer.date_of_birth
                            ? new Date(selectedCustomer.date_of_birth).toLocaleDateString()
                            : "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Address</p>
                      <p className="font-semibold text-sm sm:text-base break-words">
                        {selectedCustomer.address || "Not provided"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Account Created</p>
                        <p className="font-semibold text-sm sm:text-base break-words">
                          {new Date(selectedCustomer.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Last Sign In</p>
                        <p className="font-semibold text-sm sm:text-base break-words">
                          {selectedCustomer.last_sign_in_at
                            ? new Date(selectedCustomer.last_sign_in_at).toLocaleString()
                            : "Never"}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Orders</p>
                        <p className="font-semibold text-sm sm:text-base text-primary">
                          {selectedCustomer.orders_count || 0}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Spent</p>
                        <p className="font-semibold text-sm sm:text-base text-primary">
                          ₦{(selectedCustomer.total_spent || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
