"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { FileText, Edit3, BarChart3, Printer, MessageCircle, Clock, CheckCircle, XCircle, Download, Search, Calendar, Send, Menu, X, Paperclip, DollarSign, AlertCircle, User, MoreVertical, Phone, Video, ArrowLeft, Settings } from 'lucide-react'
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
  profiles: {
    full_name: string
    avatar_url: string
  }
}

const serviceTypes = [
  { value: "printing", label: "Document Printing", icon: Printer, color: "bg-blue-500" },
  { value: "editing", label: "Document Editing", icon: Edit3, color: "bg-green-500" },
  { value: "analysis", label: "Project Analysis", icon: BarChart3, color: "bg-purple-500" },
  { value: "other", label: "Other Services", icon: FileText, color: "bg-orange-500" },
]

export default function AdminBusinessServicesPage() {
  const { user } = useAuthStore()
  const [services, setServices] = useState<BusinessService[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<BusinessService | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [newMessage, setNewMessage] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [chatFiles, setChatFiles] = useState<File[]>([])
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [servicePrice, setServicePrice] = useState<string>("")
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)
  const [showPriceEdit, setShowPriceEdit] = useState(false)
  const chatFileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showDropdownMenu, setShowDropdownMenu] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

    useEffect(() => {
    fetchServices()

    const pusherChannel = pusherClient.subscribe(selectedService?.id || '')
    pusherChannel.bind('new-message', (data: any) => {
      fetchServices()
    })

    const supabaseChannel = supabase
      .channel("realtime:public:business_services")
      .on("postgres_changes", { event: "*", schema: "public", table: "business_services" }, (payload) => {
        fetchServices()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(supabaseChannel)
      pusherClient.unsubscribe(selectedService?.id || '')
    }
  }, [selectedService])

  useEffect(() => {
    if (selectedService) {
      setServicePrice(selectedService.price?.toString() || "")
    }
  }, [selectedService])

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
        .select(
          `
          *,
          profiles (
            full_name,
            avatar_url
          )
        `,
        )
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

  const uploadFiles = async (files: File[], serviceId: string) => {
    const uploadedFileData = []
    for (const file of files) {
      try {
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `business-services/${serviceId}/${fileName}`

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
          uploaded_by: "admin",
          uploaded_at: new Date().toISOString(),
          is_modified: true,
        })
      } catch (error) {
        console.error("Error uploading file:", error)
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    return uploadedFileData
  }

  const handleUpdateStatus = async (status: BusinessService["status"]) => {
    if (!selectedService) return

    setIsUpdating(true)
    try {
      const { error } = await supabase.from("business_services").update({ status }).eq("id", selectedService.id)
      if (error) throw error

      toast.success(`Service status updated to ${status.replace("_", " ")}`)
      fetchServices()
      setSelectedService((prev) => (prev ? { ...prev, status } : null))
    } catch (error: any) {
      toast.error(error.message || "Failed to update status")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdatePrice = async () => {
    if (!selectedService) return

    setIsUpdatingPrice(true)
    try {
      const price = servicePrice ? Number.parseFloat(servicePrice) : null
      const { error } = await supabase.from("business_services").update({ price }).eq("id", selectedService.id)
      if (error) throw error

      toast.success("Service price updated successfully")
      fetchServices()
      setSelectedService((prev) => (prev ? { ...prev, price } : null))
      setShowPriceEdit(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to update price")
    } finally {
      setIsUpdatingPrice(false)
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
        const updatedServiceFiles = [...selectedService.files, ...uploadedChatFiles]
        await supabase.from("business_services").update({ files: updatedServiceFiles }).eq("id", selectedService.id)
      }

      const newMessageObj = {
        id: Date.now().toString(),
        sender: "admin",
        message: newMessage || "Sent modified files",
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

      const updatedService = {
        ...selectedService,
        messages: updatedMessages,
        files: [...selectedService.files, ...uploadedChatFiles],
      }

      setSelectedService(updatedService)
      setServices((currentServices) =>
        currentServices.map((service) => (service.id === selectedService.id ? updatedService : service)),
      )

      setNewMessage("")
      setChatFiles([])
      toast.success("Message sent!")
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase())
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

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    )
  }

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
      customer: selectedService.profiles.full_name,
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
    link.download = `chat-export-${selectedService.id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success("Chat exported successfully!")
    setShowDropdownMenu(false)
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-black">
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
          isMobile ? "fixed inset-y-0 left-0 z-50 w-80" : "relative w-80"
        } border-r border-gray-200 dark:border-gray-700 flex flex-col`}
      >
        <div className="flex flex-col h-full bg-white dark:bg-black">
          {/* Chat List Header */}
          <div className={`${isMobile ? 'p-3' : 'p-4'} bg-primary text-white`}>
            <div className="flex items-center justify-between">
              <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>Service Requests</h2>
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(false)} className="text-white hover:bg-green-700 h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className={`${isMobile ? 'p-2' : 'p-3'} border-b bg-gray-50 dark:bg-gray-800`}>
            <div className={`relative ${isMobile ? 'mb-2' : 'mb-3'}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
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
            {sortedServices.map((service) => (
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
                  {/* Avatar */}
                  <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0`}>
                    <User className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-gray-600 dark:text-gray-300`} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold text-gray-900 dark:text-white truncate ${isMobile ? 'text-sm' : ''}`}>
                        {service.profiles.full_name}
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
                        {service.title}
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
            ))}
          </div>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {selectedService ? (
          <>
            {/* Redesigned Responsive Admin Header */}
            <header className="bg-primary text-white border-b border-gray-700">
              <div className="p-3 sm:p-4">
                {/* Top Row - User Info and Menu */}
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
                    
                    {/* User Avatar */}
                    <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-green-500 flex items-center justify-center flex-shrink-0`}>
                      <User className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-white`} />
                    </div>
                    
                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      <h1 className={`font-semibold truncate ${isMobile ? 'text-sm' : 'text-lg'}`}>
                        {selectedService.profiles.full_name}
                      </h1>
                      <p className={`text-green-100 truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {selectedService.title}
                      </p>
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
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[200px]">
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
                        {/* Mobile Price Edit */}
                        {isMobile && (
                          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Set Price</label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="Price"
                                  value={servicePrice}
                                  onChange={(e) => setServicePrice(e.target.value)}
                                  className="flex-1 h-8 text-sm"
                                />
                                <Button
                                  size="sm"
                                  onClick={handleUpdatePrice}
                                  disabled={isUpdatingPrice}
                                  className="h-8 text-xs bg-green-600 hover:bg-green-700"
                                >
                                  {isUpdatingPrice ? "..." : "Save"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row - Status, Payment, and Admin Controls */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {/* Left Side - Status and Payment */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${getStatusColor(selectedService.status)} ${isMobile ? 'text-xs px-2 py-1' : 'text-xs'}`}>
                      {getStatusIcon(selectedService.status)}
                      <span className="ml-1">{selectedService.status.replace("_", " ")}</span>
                    </Badge>
                    
                    {selectedService.payment_status === 'paid' ? (
                      <Badge className={`bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ${isMobile ? 'text-xs px-2 py-1' : 'text-xs'}`}>
                        <CheckCircle className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-1'}`} />
                        Paid
                      </Badge>
                    ) : (
                      <Badge className={`bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 ${isMobile ? 'text-xs px-2 py-1' : 'text-xs'}`}>
                        <Clock className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-1'}`} />
                        Unpaid
                      </Badge>
                    )}

                    {selectedService.price && (
                      <Badge variant="outline" className={`bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 ${isMobile ? 'text-xs px-2 py-1' : 'text-xs'}`}>
                        ₦{selectedService.price.toLocaleString()}
                      </Badge>
                    )}
                  </div>

                  {/* Right Side - Admin Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Desktop Price Edit */}
                    {!isMobile && (
                      <div className="flex items-center gap-2">
                        {showPriceEdit ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Price"
                              value={servicePrice}
                              onChange={(e) => setServicePrice(e.target.value)}
                              className="w-24 h-8 text-sm bg-white text-black"
                            />
                            <Button
                              size="sm"
                              onClick={handleUpdatePrice}
                              disabled={isUpdatingPrice}
                              className="h-8 bg-green-700 hover:bg-green-800"
                            >
                              {isUpdatingPrice ? "..." : "Save"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowPriceEdit(false)}
                              className="h-8 text-white hover:bg-green-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowPriceEdit(true)}
                            className="text-white hover:bg-green-700 flex items-center gap-1 text-xs"
                          >
                            <DollarSign className="h-3 w-3" />
                            {selectedService.price ? `₦${selectedService.price.toLocaleString()}` : "Set Price"}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Status Update Dropdown */}
                    <select
                      value={selectedService.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as BusinessService["status"])}
                      disabled={isUpdating}
                      className={`px-2 py-1 bg-green-700 text-white border border-green-500 rounded ${isMobile ? 'text-xs' : 'text-sm'}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </header>

            {/* Chat Messages Area */}
            <div className={`flex-1 overflow-y-auto bg-white dark:bg-black space-y-3 ${isMobile ? 'p-2' : 'p-4'}`}>
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
                  className={`flex ${message.sender === "admin" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`${isMobile ? 'max-w-xs px-3 py-2' : 'max-w-md px-4 py-2'} rounded-lg shadow-sm ${
                      message.sender === "admin"
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
                      message.sender === "admin" ? "text-green-100" : "text-gray-500 dark:text-gray-400"
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
          <div className={`flex-1 flex flex-col items-center justify-center text-center bg-white dark:bg-black ${isMobile ? 'p-4' : 'p-4'}`}>
            {isMobile && (
              <Button
                variant="outline"
                onClick={() => setShowMobileSidebar(true)}
                className={`mb-6 ${isMobile ? 'text-sm' : ''}`}
              >
                <Menu className="h-4 w-4 mr-2" />
                View Service Requests
              </Button>
            )}
            <div className={`bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 ${isMobile ? 'w-24 h-24' : 'w-32 h-32'}`}>
              <MessageCircle className={`text-gray-400 dark:text-gray-500 ${isMobile ? 'h-12 w-12' : 'h-16 w-16'}`} />
            </div>
            <h2 className={`font-semibold mb-2 text-gray-900 dark:text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Sm@rtz Global Ventures Business Services
            </h2>
            <p className={`text-gray-600 dark:text-gray-400 max-w-md ${isMobile ? 'text-sm' : ''}`}>
              Select a service request from the list to start managing the conversation and files.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}