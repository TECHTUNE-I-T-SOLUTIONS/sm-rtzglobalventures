"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Paperclip, Smile, ImageIcon, FileText, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { GoogleGenerativeAI, type ChatSession, SchemaType } from "@google/generative-ai"
import { supabase } from "@/lib/supabase"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "")

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  attachment?: {
    name: string
    type: string
    url: string
  }
}

const emojis = ["😊", "😂", "❤️", "👍", "👎", "😢", "😮", "😡", "🤔", "👋", "🙏", "💯", "🔥", "⭐", "❓", "❗"]

export function CustomerSupportChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [chat, setChat] = useState<ChatSession | null>(null)

  // Define the functions that implement your tools
  const toolFunctions = {
    check_product_availability: async ({ productName }: { productName: string }) => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('name, price, category, stock_quantity')
          .ilike('name', `%${productName}%`)
          .eq('is_active', true)
          .limit(5);

        if (error) throw error;

        if (data && data.length > 0) {
          return { products: data.map(p => ({...p, name_slug: p.name.toLowerCase().replace(/\s+/g, '-')})) };
        } else {
          return { message: `I couldn't find any products matching '${productName}'.` };
        }
      } catch (error) {
        console.error('Error checking product availability:', error);
        return { error: 'Failed to check product availability.' };
      }
    },
    find_post: async ({ postTitle }: { postTitle: string }) => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title')
          .ilike('title', `%${postTitle}%`)
          .limit(5);

        if (error) throw error;

        if (data && data.length > 0) {
          return { posts: data };
        } else {
          return { message: `I couldn't find any posts matching '${postTitle}'.` };
        }
      } catch (error) {
        console.error('Error finding post:', error);
        return { error: 'Failed to find post.' };
      }
    },
  };

  const startChatSession = () => {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [
        {
          functionDeclarations: [
            {
              name: "check_product_availability",
              description: "Checks the availability and details of products in the database.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  productName: {
                    type: SchemaType.STRING,
                    description: "The name of the product to check.",
                  },
                },
                required: ["productName"],
              },
            },
            {
              name: "find_post",
              description: "Finds a blog post by its title in the database.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  postTitle: {
                    type: SchemaType.STRING,
                    description: "The title of the post to find.",
                  },
                },
                required: ["postTitle"],
              },
            },
          ],
        },
      ],
    })
    const initialSystemPrompt = `You are Sm@rtz CS, a friendly, fun, and helpful customer support assistant for Sm@rtz Global Enterprise. Your personality is engaging and you love using emojis! 🥳

We are a global e-commerce platform and retailer with three subsidiaries:

1. Sm@rtz Computers: We sell all kinds of computers (like MacBooks, HP, Dell, etc.), accessories, chargers, cables, and other tech products. We are a computer retailer.
2. Sm@rtz Bookshop & Bookstore: Academic books, literature, educational materials.
3. Business Center: Document printing, editing, project analysis services.

Our location: Shop 4 & 5, Behind Faculty of CIS, University of Ilorin PS, Ilorin, Nigeria
CEO: Eneji Daniel Moses

We serve customers globally and offer:
- Online shopping with worldwide delivery
- Competitive prices and student discounts
- Professional document services
- 24/7 customer support

You have access to tools to check for product availability and find blog posts.
- When a user asks about a product, use the 'check_product_availability' tool. If found, tell the user it's available and provide a link in this format: 'https://smartzglobalventures.vercel.app/products/[category]/[product_name_slug]'. Do not show the raw data from the tool.
- If a product is not found, be friendly about it. You can suggest they check back later or ask if they are interested in something else.
- When a user asks about a post, use the 'find_post' tool. If found, provide a link in this format: 'https://smartzglobalventures.vercel.app/posts/[post-id]'.
- For product names in links, you are provided a 'name_slug' field which is a URL-friendly slug (lowercase, spaces to dashes). Use it directly.

Keep responses concise, friendly, and relevant to our services. Start the conversation by greeting the user and asking how you can help.`

    const newChat = model.startChat({
      history: [
        { role: "user", parts: [{ text: initialSystemPrompt }] },
        { role: "model", parts: [{ text: "Hello! I'm Sm@rtz CS, your virtual assistant. How can I help you today? 😊" }] }
      ],
      generationConfig: {
        maxOutputTokens: 1000,
      },
    })
    setChat(newChat)
    setMessages([
      {
        id: "1",
        text: "Hello! I'm Sm@rtz CS, your virtual assistant. How can I help you today? 😊",
        sender: "bot",
        timestamp: new Date(),
      },
    ])
  }

  useEffect(() => {
    if (isOpen) {
      startChatSession()
    } else {
      // Reset chat when closed
      setChat(null)
      setMessages([])
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loadingMessage])

  const sendMessage = async (messageText?: string, attachment?: any) => {
    const textToSend = messageText || inputValue
    if (!textToSend.trim() && !attachment) return
    if (!chat) {
      console.error("Chat not initialized")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: "user",
      timestamp: new Date(),
      attachment,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setLoadingMessage("Thinking... 🤔")

    try {
      const prompt = `${attachment ? `The user has shared a file: ${attachment.name} (${attachment.type})` : ""} ${textToSend}`
      let result = await chat.sendMessage(prompt)

      while (true) {
        const response = await result.response;
        const functionCalls = response.functionCalls();

        if (!functionCalls || functionCalls.length === 0) {
          const text = response.text();
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text,
            sender: "bot",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
          break;
        }

        const call = functionCalls[0];
        let apiResponse;

        // Update loading message for tool search UX and call the tool
        if (call.name === 'check_product_availability') {
          const args = call.args as { productName: string };
          if (args.productName) {
            setLoadingMessage(`Let me check our inventory for "${args.productName}"... 🕵️‍♂️`);
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
          apiResponse = await toolFunctions.check_product_availability(args);
        } else if (call.name === 'find_post') {
          const args = call.args as { postTitle: string };
          if (args.postTitle) {
            setLoadingMessage(`Searching our blog for "${args.postTitle}"... 📚`);
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
          apiResponse = await toolFunctions.find_post(args);
        } else {
            throw new Error(`Unknown tool: ${call.name}`);
        }

        result = await chat.sendMessage([
          {
            functionResponse: {
              name: call.name,
              response: apiResponse,
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error generating response:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble connecting right now. Please try again later or contact us directly at our location. 😔",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoadingMessage(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setInputValue((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    const attachment = {
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }

    sendMessage(`I've shared a file: ${file.name}`, attachment)
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-24 right-6 z-50 group">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 border-2 border-white dark:border-gray-800"
            size="icon"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageCircle className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
        <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Customer Support
        </div>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-32 right-6 z-50 w-80 sm:w-96 h-[500px] max-h-[80vh]"
          >
            <Card className="h-full flex flex-col bg-white/90 dark:bg-black/90 backdrop-blur-lg border shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-primary text-white rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <img src="/logo.png" alt="Logo" className="h-10 w-12" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold">Sm@rtz CS</h3>
                    <p className="text-xs text-white/80">Online • Typically replies instantly</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-background">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${ 
                        message.sender === "user"
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-card border rounded-bl-md shadow-sm"
                      }`}
                    >
                      {message.attachment && (
                        <div className="mb-2 p-2 bg-white/10 rounded-lg">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {message.attachment.type.startsWith("image/") ? (
                              <ImageIcon className="h-4 w-4 flex-shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 flex-shrink-0" />
                            )}
                            <span className="text-xs truncate">{message.attachment.name}</span>
                          </div>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === "user" ? "text-white/70" : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {loadingMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-card border px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <Search className="h-4 w-4 animate-pulse" />
                        <p>{loadingMessage}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 border-t bg-background"
                  >
                    <div className="grid grid-cols-8 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiClick(emoji)}
                          className="p-2 hover:bg-muted rounded-lg text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input */}
              <div className="p-4 border-t bg-background">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={handleKeyPress}
                      disabled={loadingMessage !== null}
                      className="pr-20 bg-muted/50 border-muted"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loadingMessage !== null}
                      >
                        <Paperclip className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={loadingMessage !== null}
                      >
                        <Smile className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={() => sendMessage()}
                    disabled={loadingMessage !== null || !inputValue.trim()}
                    size="icon"
                    className="h-10 w-10"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Powered by Sm@rtz AI • We're here to help 24/7
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
