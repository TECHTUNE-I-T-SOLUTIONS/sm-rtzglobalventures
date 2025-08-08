"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { Plus, FileText, Edit3, BarChart3, Printer, Upload, MessageCircle, Clock, CheckCircle, XCircle, Download, Search, Calendar, DollarSign, X, Paperclip, AlertCircle, User, MoreVertical, Menu, Send, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import { pusherClient } from "@/lib/pusher"

interface BusinessService {
  id: string
  service_type: "printing" | "editing" | "analysis" | "other"
  title: string
  description: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority?: "low" | "normal" | "high"
  price: number | null
  files: any[]
  messages: any[]
  created_at: string
  updated_at: string
  payment_status: "unpaid" | "paid"
}

const serviceTypes = [
  { value: "printing", label: "Document Printing", icon: Printer, color: "bg-blue-500" },
  { value: "editing", label: "Document Editing", icon: Edit3, color: "bg-green-500" },
  { value: "analysis", label: "Project Analysis", icon: BarChart3, color: "bg-purple-500" },
  { value: "other", label: "Other Services", icon: FileText, color: "bg-orange-500" },
]

export default function BusinessServicesPage() {
  const { user } = useAuthStore()
  const [services, setServices] = useState<BusinessService[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<BusinessService | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [newMessage, setNewMessage] = useState("")
  const [chatFiles, setChatFiles] = useState<File[]>([])
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showNewServiceModal, setShowNewServiceModal] = useState(false)
  const [showDropdownMenu, setShowDropdownMenu] = useState(false)
  const [newService, setNewService] = useState({
    service_type: "printing" as const,
    title: "",
    description: "",
    priority: "normal" as "low" | "normal" | "high",
  })
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  const chatFileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const verifyPayment = async (reference: string) => {
    const toastId = toast.loading("Verifying payment...");
    try {
      const response = await fetch("/api/paystack/services-callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reference }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify payment");
      }

      toast.success("Payment successful!", { id: toastId });
      fetchServices();
    } catch (error: any) {
      console.error("Payment verification error:", error);
      toast.error(error.message || "An error occurred during payment verification.", { id: toastId });
    }
  };

  useEffect(() => {
    if (user) {
      fetchServices();

      const url = new URL(window.location.href);
      const reference = url.searchParams.get("reference");
      if (reference) {
        verifyPayment(reference);
        window.history.replaceState({}, document.title, "/dashboard/services");
      }
    }

    const supabaseChannel = supabase
      .channel("realtime:public:business_services")
      .on("postgres_changes", { event: "*", schema: "public", table: "business_services" }, (payload) => {
        fetchServices();
      })
      .subscribe();

    if (selectedService) {
      const pusherChannel = pusherClient.subscribe(selectedService.id);
      pusherChannel.bind('new-message', (data: any) => {
        if (selectedService && data.channel === selectedService.id) {
          setSelectedService((prev) => {
            if (!prev) return null
            return { ...prev, messages: [...prev.messages, data.message] }
          })
        }
      });

      return () => {
        supabase.removeChannel(supabaseChannel);
        pusherClient.unsubscribe(selectedService.id);
      };
    }

    return () => {
      supabase.removeChannel(supabaseChannel);
    };
  }, [user, selectedService]);

  useEffect(() => {
    scrollToBottom()
  }, [selectedService?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("business_services")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error("Error fetching services:", error)
      toast.error("Failed to fetch services")
    } finally {
      setLoading(false)
    }
  }

  const uploadFiles = async (files: File[], serviceId?: string) => {
    const uploadedFileData = []
    for (const file of files) {
      try {
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `business-services/${serviceId || "temp"}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("files").upload(filePath, file)
        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("files").getPublicUrl(filePath)

        uploadedFileData.push({
          id: Date.now().toString() + Math.random().toString(36).substring(2),
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          path: filePath,
          uploaded_by: "user",
          uploaded_at: new Date().toISOString(),
          is_modified: false,
        })
      } catch (error) {
        console.error("Error uploading file:", error)
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    return uploadedFileData
  }

  const handleCreateService = async () => {
    if (!newService.title || !newService.description) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsUploading(true)
    try {
      const priority = newService.priority === 'normal' ? 'medium' : newService.priority;
      const { data: serviceData, error: serviceError } = await supabase
        .from("business_services")
        .insert([
          {
            user_id: user?.id,
            service_type: newService.service_type,
            title: newService.title,
            description: newService.description,
            status: "pending",
            priority: priority,
            files: [],
            messages: [
              {
                id: Date.now().toString(),
                sender: "user",
                message: `Service request created: ${newService.title}`,
                timestamp: new Date().toISOString(),
                files: [],
              },
            ],
          },
        ])
        .select()
        .single()

      if (serviceError) throw serviceError

      let uploadedFileData: any[] = []
      if (uploadedFiles.length > 0) {
        uploadedFileData = await uploadFiles(uploadedFiles, serviceData.id)
      }

      const { error: updateError } = await supabase
        .from("business_services")
        .update({ files: uploadedFileData })
        .eq("id", serviceData.id)

      if (updateError) throw updateError

      toast.success("Service request created successfully!")
      setShowNewServiceModal(false)
      setNewService({ service_type: "printing", title: "", description: "", priority: "normal" as "low" | "normal" | "high" })
      setUploadedFiles([])
      fetchServices()
    } catch (error: any) {
      console.error("Error creating service:", error)
      toast.error(error.message || "Failed to create service request")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() && chatFiles.length === 0) return
    if (!selectedService) return

    setIsSendingMessage(true)
    try {
      let uploadedChatFiles: any[] = []
      if (chatFiles.length > 0) {
        uploadedChatFiles = await uploadFiles(chatFiles, selectedService.id)
      }

      const newMessageObj = {
        id: Date.now().toString(),
        sender: "user",
        message: newMessage || "Sent files",
        timestamp: new Date().toISOString(),
        files: uploadedChatFiles,
      }

      const updatedMessages = [...selectedService.messages, newMessageObj]

      const { error } = await supabase
        .from("business_services")
        .update({ messages: updatedMessages })
        .eq("id", selectedService.id)

      if (error) throw error

      await fetch('/api/pusher', {
        method: 'POST',
        body: JSON.stringify({ channel: selectedService.id, message: newMessageObj }),
      })

      setSelectedService({ ...selectedService, messages: updatedMessages })
      setNewMessage("")
      setChatFiles([])
      toast.success("Message sent!")
      fetchServices()
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setChatFiles((prev) => [...prev, ...files])
  }

  const removeChatFile = (index: number) => {
    setChatFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const downloadFile = async (file: any) => {
    if (file.uploaded_by === 'admin' && selectedService?.payment_status === 'unpaid') {
      toast.error("Please pay for the service to download this file.");
      return;
    }

    try {
      const { data, error } = await supabase.storage.from("files").download(file.path)
      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading file:", error)
      toast.error("Failed to download file")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
      case "in_progress":
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
      case "cancelled":
        return <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
      default:
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
    }
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || service.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case "status":
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  const handleCloseChat = () => {
    setSelectedService(null)
    setShowDropdownMenu(false)
    if (isMobile) {
      setShowMobileSidebar(true)
    }
  }

  const handleExportChat = () => {
    if (!selectedService) return
    
    const chatData = {
      service: selectedService.title,
      status: selectedService.status,
      price: selectedService.price,
      created: selectedService.created_at,
      messages: selectedService.messages,
      files: selectedService.files
    }
    
    const dataStr = JSON.stringify(chatData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `service-export-${selectedService.id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success("Service exported successfully!")
    setShowDropdownMenu(false)
  }

  const handlePayment = async () => {
    if (!selectedService) return;

    const toastId = toast.loading("Initiating payment...");
    try {
      const response = await fetch("/api/payments/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ service_id: selectedService.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate payment");
      }

      toast.success("Redirecting to payment page...", { id: toastId });
      window.location.href = data.authorization_url;
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "An error occurred during payment.", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileSidebar && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile && !showMobileSidebar ? "-100%" : "0%",
        }}
        className={`${
          isMobile ? "fixed inset-y-0 left-0 z-50 w-72" : "relative w-80"
        } border-r border-gray-200 dark:border-gray-700 flex flex-col`}
      >
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
          {/* Chat List Header */}
          <div className={`${isMobile ? 'p-3' : 'p-4'} bg-primary text-white`}>
            <div className="flex items-center justify-between">
              <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>Business Services</h2>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNewServiceModal(true)}
                  className="text-white hover:bg-green-700 h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {isMobile && (
                  <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(false)} className="text-white hover:bg-green-700 h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className={`${isMobile ? 'p-2' : 'p-3'} border-b bg-gray-50 dark:bg-gray-800`}>
            <div className={`relative ${isMobile ? 'mb-2' : 'mb-3'}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 ${isMobile ? 'h-8 text-sm' : ''}`}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`flex-1 px-2 py-1 border rounded-md bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`flex-1 px-2 py-1 border rounded-md bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="status">By Status</option>
              </select>
            </div>
          </div>

          {/* Services List */}
          <div className="flex-1 overflow-y-auto">
            {sortedServices.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No services found</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Create your first service request to get started
                </p>
                <Button onClick={() => setShowNewServiceModal(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </div>
            ) : (
              sortedServices.map((service) => {
                const serviceType = serviceTypes.find((type) => type.value === service.service_type)
                return (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service)
                      if (isMobile) setShowMobileSidebar(false)
                    }}
                    className={`w-full text-left ${isMobile ? 'p-3' : 'p-4'} transition-colors border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedService?.id === service.id ? "bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Service Icon */}
                      <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full ${serviceType?.color} flex items-center justify-center flex-shrink-0`}>
                        {serviceType?.icon && <serviceType.icon className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold text-gray-900 dark:text-white truncate ${isMobile ? 'text-sm' : ''}`}>
                            {service.title}
                          </h3>
                          <span className={`text-gray-500 dark:text-gray-400 flex-shrink-0 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                            {isMobile
                              ? new Date(service.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                              : new Date(service.created_at).toLocaleDateString()
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className={`text-gray-600 dark:text-gray-300 truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            {serviceType?.label}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Badge className={`${getStatusColor(service.status)} ${isMobile ? 'text-xs px-1 py-0' : 'text-xs'}`}>
                              {getStatusIcon(service.status)}
                            </Badge>
                            {service.messages.length > 0 && (
                              <span className={`bg-green-500 text-white rounded-full text-center ${isMobile ? 'text-xs px-1.5 py-0.5 min-w-[18px]' : 'text-xs px-2 py-1 min-w-[20px]'}`}>
                                {service.messages.length}
                              </span>
                            )}
                          </div>
                        </div>
                        {service.price && (
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline" className={`bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 ${isMobile ? 'text-xs px-1 py-0' : 'text-xs'}`}>
                              ₦{service.price.toLocaleString()}
                            </Badge>
                            {service.payment_status === 'paid' ? (
                              <Badge className={`bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ${isMobile ? 'text-xs px-1 py-0' : 'text-xs'}`}>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Paid
                              </Badge>
                            ) : (
                              <Badge className={`bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 ${isMobile ? 'text-xs px-1 py-0' : 'text-xs'}`}>
                                <Clock className="h-3 w-3 mr-1" />
                                Unpaid
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {selectedService ? (
          <>
            {/* Redesigned Responsive Chat Header */}
            <header className="bg-primary text-white border-b border-gray-700">
              <div className="p-3 sm:p-4">
                {/* Top Row - Main Info */}
                <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {/* Mobile Menu Button */}
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowMobileSidebar(true)}
                        className="text-white hover:bg-green-700 flex-shrink-0 h-8 w-8"
                      >
                        <Menu className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* Service Icon */}
                    <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full ${serviceTypes.find(t => t.value === selectedService.service_type)?.color} flex items-center justify-center flex-shrink-0`}>
                      {(() => {
                        const serviceType = serviceTypes.find(t => t.value === selectedService.service_type)
                        return serviceType?.icon ? <serviceType.icon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-white`} /> : null
                      })()}
                    </div>
                    
                    {/* Service Title */}
                    <div className="min-w-0 flex-1">
                      <h1 className={`font-semibold truncate ${isMobile ? 'text-sm' : 'text-lg'}`}>
                        {selectedService.title}
                      </h1>
                    </div>
                  </div>

                  {/* Menu Button */}
                  <div className="relative flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`text-white hover:bg-green-700 ${isMobile ? 'h-8 w-8' : ''}`}
                      onClick={() => setShowDropdownMenu(!showDropdownMenu)}
                    >
                      <MoreVertical className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    </Button>
                    
                    {showDropdownMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[150px]">
                        <button
                          onClick={handleCloseChat}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Close Chat
                        </button>
                        <button
                          onClick={handleExportChat}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row - Status and Actions */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(selectedService.status)} ${isMobile ? 'text-xs px-2 py-1' : 'text-xs'}`}>
                      {getStatusIcon(selectedService.status)}
                      <span className="ml-1">{selectedService.status.replace("_", " ")}</span>
                    </Badge>
                  </div>

                  {/* Price and Payment Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedService.price && (
                      <Badge variant="outline" className={`bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 ${isMobile ? 'text-xs px-2 py-1' : 'text-xs'}`}>
                        ₦{selectedService.price.toLocaleString()}
                      </Badge>
                    )}
                    
                    {selectedService.price && selectedService.payment_status === "unpaid" && (
                      <Button 
                        onClick={handlePayment} 
                        size={isMobile ? "sm" : "sm"} 
                        className={`bg-green-600 hover:bg-green-700 text-white ${isMobile ? 'text-xs px-2 py-1 h-7' : ''}`}
                      >
                        <DollarSign className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                        {isMobile ? 'Pay' : `Pay ₦${selectedService.price.toLocaleString()}`}
                      </Button>
                    )}
                    
                    {selectedService.price && selectedService.payment_status === "paid" && (
                      <Badge className={`bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ${isMobile ? 'text-xs px-2 py-1' : 'text-xs'}`}>
                        <CheckCircle className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-1'}`} />
                        Paid
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Chat Messages Area */}
            <div className={`flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 space-y-3 ${isMobile ? 'p-2' : 'p-4'}`}>
              {/* Service Request Info Message */}
              <div className="flex justify-center">
                <div className={`bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded-lg max-w-md text-center ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <div className="font-semibold">{selectedService.title}</div>
                  <div className={`mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>{selectedService.description}</div>
                  <div className={`mt-2 text-yellow-600 dark:text-yellow-300 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    Created: {new Date(selectedService.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* File Attachments */}
              {selectedService.files.length > 0 && (
                <div className="flex justify-start">
                  <div className={`bg-white dark:bg-gray-700 rounded-lg shadow-sm ${isMobile ? 'p-2 max-w-[280px] w-full' : 'p-3 max-w-md'}`}>
                    <div className={`font-medium mb-2 text-gray-900 dark:text-white ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      📎 Attached Files
                    </div>
                    <div className="space-y-2">
                      {selectedService.files.map((file: any, index: number) => (
                        <div key={index} className={`flex items-center gap-2 bg-gray-50 dark:bg-gray-600 rounded ${isMobile ? 'p-1.5' : 'p-2'}`}>
                          <FileText className={`text-gray-500 flex-shrink-0 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                          <div className="flex-1 min-w-0 pr-1">
                            <div className={`truncate text-gray-900 dark:text-white ${isMobile ? 'text-xs' : 'text-sm'}`}>{file.name}</div>
                            <div className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                              {(file.size / 1024).toFixed(1)} KB
                              {file.is_modified && (
                                <Badge variant="outline" className={`ml-1 ${isMobile ? 'text-xs px-1' : 'text-xs'}`}>
                                  <AlertCircle className={`mr-1 ${isMobile ? 'h-2 w-2' : 'h-3 w-3'}`} />
                                  Modified
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadFile(file)}
                            className={`flex-shrink-0 ${isMobile ? 'h-7 w-7 p-1' : 'h-8 w-8 p-1'}`}
                          >
                            <Download className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {selectedService.messages.map((message: any) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`${isMobile ? 'max-w-xs px-3 py-2' : 'max-w-md px-4 py-2'} rounded-lg shadow-sm ${
                      message.sender === "user"
                        ? "bg-green-500 text-white"
                        : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    <p className={isMobile ? 'text-sm' : 'text-sm'}>{message.message}</p>
                    
                    {/* Message Files */}
                    {message.files && message.files.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.files.map((file: any, fileIndex: number) => (
                          <div key={fileIndex} className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                            <FileText className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                            <span className="truncate">{file.name}</span>
                            {file.is_modified && (
                              <Badge variant="outline" className={isMobile ? 'text-xs px-1' : 'text-xs'}>
                                Modified
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadFile(file)}
                              className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} p-0`}
                            >
                              <Download className={`${isMobile ? 'h-2 w-2' : 'h-3 w-3'}`} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className={`mt-1 ${isMobile ? 'text-xs' : 'text-xs'} ${
                      message.sender === "user" ? "text-green-100" : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Area */}
            <div className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${isMobile ? 'p-2' : 'p-4'}`}>
              {/* File attachments preview */}
              {chatFiles.length > 0 && (
                <div className={`mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg ${isMobile ? 'mb-2' : ''}`}>
                  <div className={`font-medium mb-2 text-gray-900 dark:text-white ${isMobile ? 'text-xs' : 'text-sm'}`}>Attachments:</div>
                  <div className="space-y-2">
                    {chatFiles.map((file, index) => (
                      <div key={index} className={`flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <FileText className={`text-gray-500 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                        <span className="flex-1 truncate text-gray-900 dark:text-white">{file.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeChatFile(index)}
                          className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} p-0`}
                        >
                          <X className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="flex items-end gap-2">
                <input
                  ref={chatFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                  onChange={handleChatFileSelect}
                  className="hidden"
                />
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => chatFileInputRef.current?.click()}
                  className={`flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ${isMobile ? 'h-8 w-8' : ''}`}
                >
                  <Paperclip className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                </Button>

                <div className={`flex-1 bg-gray-100 dark:bg-gray-800 rounded-full ${isMobile ? 'px-3 py-1' : 'px-4 py-2'}`}>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    className={`border-0 bg-transparent focus:ring-0 focus:outline-none text-gray-900 dark:text-white ${isMobile ? 'text-sm h-6' : ''}`}
                  />
                </div>

                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && chatFiles.length === 0) || isSendingMessage}
                  className={`flex-shrink-0 bg-green-500 hover:bg-green-600 text-white rounded-full ${isMobile ? 'h-8 w-8' : ''}`}
                >
                  {isSendingMessage ? (
                    <div className={`animate-spin rounded-full border-b-2 border-white ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`}></div>
                  ) : (
                    <Send className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800 ${isMobile ? 'p-4' : 'p-4'}`}>
            {isMobile && (
              <Button
                variant="outline"
                onClick={() => setShowMobileSidebar(true)}
                className={`mb-6 ${isMobile ? 'text-sm' : ''}`}
              >
                <Menu className="h-4 w-4 mr-2" />
                View Services
              </Button>
            )}
            <div className={`bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 ${isMobile ? 'w-24 h-24' : 'w-32 h-32'}`}>
              <MessageCircle className={`text-gray-400 dark:text-gray-500 ${isMobile ? 'h-12 w-12' : 'h-16 w-16'}`} />
            </div>
            <h2 className={`font-semibold mb-2 text-gray-900 dark:text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Business Center Services
            </h2>
            <p className={`text-gray-600 dark:text-gray-400 max-w-md ${isMobile ? 'text-sm' : ''}`}>
              Select a service request from the list to start managing your conversation and files.
            </p>
          </div>
        )}
      </main>

      {/* New Service Modal */}
      <AnimatePresence>
        {showNewServiceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewServiceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-black rounded-lg w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-background border-b p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">New Service Request</h2>
                    <p className="text-sm text-muted-foreground">Create a new business service request</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowNewServiceModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Service Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {serviceTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setNewService({ ...newService, service_type: type.value as any })}
                        className={`p-3 sm:p-4 border rounded-lg text-left transition-all duration-200 ${
                          newService.service_type === type.value
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-muted hover:border-primary/50 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${type.color} flex-shrink-0`}>
                            <type.icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm sm:text-base">{type.label}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Request Title *</label>
                    <Input
                      value={newService.title}
                      onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                      placeholder="Brief description of your request"
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <select
                      value={newService.priority}
                      onChange={(e) => setNewService({ ...newService, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-black text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Detailed Description *</label>
                  <Textarea
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Provide detailed information about your requirements..."
                    rows={4}
                    className="bg-background resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Upload Files (Optional)</label>
                  <div className="border-2 border-dashed border-muted rounded-lg p-4 sm:p-6 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                      Drag and drop files here, or click to select
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                      onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-background hover:bg-muted"
                    >
                      Select Files
                    </Button>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium">Selected Files:</p>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <span className="text-muted-foreground text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploadedFiles((files) => files.filter((_, i) => i !== index))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-background border-t p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewServiceModal(false)}
                    className="bg-background order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateService}
                    disabled={isUploading || !newService.title || !newService.description}
                    className="bg-primary hover:bg-primary/90 order-1 sm:order-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}