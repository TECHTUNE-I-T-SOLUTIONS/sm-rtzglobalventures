"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Paperclip, Smile, ImageIcon, FileText, Search, Maximize, Minimize, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import ReactMarkdown from "react-markdown"
import { GoogleGenerativeAI, type ChatSession, SchemaType } from "@google/generative-ai"
import { supabase } from "@/lib/supabase"
import { getBaseUrl, formatPrice } from "@/lib/utils"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { useToast } from "@/components/ui/use-toast"

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
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [lastQuery, setLastQuery] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isMaximized, setIsMaximized] = useState(false)
  const STORAGE_KEY = "smrtz_chat_history_v1"
  const THEME_KEY = "smrtz_chat_theme_v1"
  const MAX_HISTORY = 200
  const [isChatDark, setIsChatDark] = useState(false)

  // Define the functions that implement your tools
  const toolFunctions = {
    search_inventory: async ({ query }: { query: string }) => {
      // Use server API to avoid client RLS/anon limitations and ensure consistent results
      try {
        const res = await fetch('/api/search-inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })
        const data = await res.json()
        return data
      } catch (error) {
        console.error('Error searching inventory via API:', error)
        return { error: 'Failed to search inventory.' }
      }
    },
    similar_titles: async ({ query }: { query: string }) => {
      try {
        const res = await fetch('/api/similar-titles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, limit: 6 }),
        })
        return await res.json()
      } catch (e) {
        console.error('Error getting similar titles:', e)
        return { error: 'Failed to fetch similar titles.' }
      }
    },
    recommendations: async () => {
      try {
        const res = await fetch('/api/recommendations')
        return await res.json()
      } catch (e) {
        console.error('Error getting recommendations:', e)
        return { error: 'Failed to fetch recommendations.' }
      }
    },
  check_product_availability: async ({ productName }: { productName: string }) => {
      try {
        const { data, error } = await supabase
          .from('products')
      .select('id, name, price, category, stock_quantity')
          .ilike('name', `%${productName}%`)
          .eq('is_active', true)
          .limit(5);

        if (error) throw error;

        if (data && data.length > 0) {
          return { products: data };
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
    find_ebook: async ({ ebookTitle }: { ebookTitle: string }) => {
      try {
        const { data, error } = await supabase
          .from('ebooks')
          .select('id, title, author, price, is_free')
          .ilike('title', `%${ebookTitle}%`)
          .limit(5);

        if (error) throw error;

        if (data && data.length > 0) {
          return { ebooks: data };
        } else {
          return { message: `I couldn't find any e-books matching '${ebookTitle}'.` };
        }
      } catch (error) {
        console.error('Error finding e-book:', error);
        return { error: 'Failed to find e-book.' };
      }
    },
  };

  const loadSavedMessages = (): Message[] | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as any[]
      return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
    } catch (e) {
      console.warn('Failed to load saved chat messages', e)
      return null
    }
  }

  const loadSavedTheme = () => {
    try {
      const raw = localStorage.getItem(THEME_KEY)
      return raw === 'dark'
    } catch (e) {
      return false
    }
  }

  const PENDING_KEY = 'smrtz_chat_pending_v1'

  const addPendingMessage = (payload: any) => {
    try {
      const raw = localStorage.getItem(PENDING_KEY)
      const arr = raw ? JSON.parse(raw) : []
      arr.push(payload)
      localStorage.setItem(PENDING_KEY, JSON.stringify(arr))
      setPendingCount(arr.length)
    } catch (e) { console.warn('failed to add pending', e) }
  }

  const [pendingCount, setPendingCount] = useState(0)
  const [pendingIds, setPendingIds] = useState<string[]>([])
  const [isRetrying, setIsRetrying] = useState(false)
  const { toast } = useToast()

  const retryPending = async () => {
    setIsRetrying(true)
    try {
      const raw = localStorage.getItem(PENDING_KEY)
      if (!raw) { setPendingCount(0); return }
      const arr = JSON.parse(raw) as any[]
      const remaining: any[] = []
      for (const item of arr) {
        const res = await postWithRetry('/api/customer-support/messages', item, 2)
        if (!res) {
          remaining.push(item)
        } else {
          // remove from pendingIds
          if (item.clientMessageId) setPendingIds((p) => p.filter((id) => id !== item.clientMessageId))
        }
      }
      if (remaining.length) localStorage.setItem(PENDING_KEY, JSON.stringify(remaining))
      else localStorage.removeItem(PENDING_KEY)
      setPendingCount(remaining.length)
    } catch (e) {
      console.warn('retryPending failed', e)
    } finally {
      setIsRetrying(false)
    }
  }
  
  // attempt retry when coming online
  useEffect(() => {
    retryPending()
    const onOnline = () => retryPending()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closeChat = () => {
    try { document.body.style.overflow = '' } catch (e) {}
    setIsMaximized(false)
    setIsOpen(false)
  }

  const toggleOpen = () => {
    if (isOpen) closeChat()
    else setIsOpen(true)
  }

  // session token management (anonymous session stored in localStorage)
  const SESSION_KEY = 'smrtz_chat_session_token'
  const getOrCreateSessionToken = () => {
    try {
      let t = localStorage.getItem(SESSION_KEY)
      if (t) return t
      t = `sess_${Math.random().toString(36).slice(2, 12)}`
      localStorage.setItem(SESSION_KEY, t)
      return t
    } catch (e) {
      return `sess_${Math.random().toString(36).slice(2, 12)}`
    }
  }

  const startChatSession = async () => {
    const baseURL = getBaseUrl()
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [
        {
          functionDeclarations: [
            {
              name: "search_inventory",
              description: "Searches both products and e-books for a title or name (use when user asks for a book, ebook, or when unsure).",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  query: {
                    type: SchemaType.STRING,
                    description: "The title or name of the product or book to search for.",
                  },
                },
                required: ["query"],
              },
            },
            {
              name: "similar_titles",
              description: "Suggest similar titles across ebooks and books by fuzzy matching titles/authors.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  query: { type: SchemaType.STRING, description: "The reference title or author." }
                },
                required: ["query"],
              },
            },
            {
              name: "recommendations",
              description: "Show new arrivals and general suggestions.",
              parameters: { type: SchemaType.OBJECT, properties: {}, required: [] },
            },
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
            {
              name: "find_ebook",
              description: "Finds an e-book by its title in the database to check for availability, price, and other details.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  ebookTitle: {
                    type: SchemaType.STRING,
                    description: "The title of the e-book to find.",
                  },
                },
                required: ["ebookTitle"],
              },
            },
          ],
        },
      ],
    })
  const initialSystemPrompt = `You are Sm@rtz CS, the professional yet friendly assistant for Sm@rtz Global Ventures. Be concise, warm, and human. Use tasteful emojis when helpful. 🥳

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

You have access to tools to check our inventory. Always use Markdown to make your answers clear and easy to read (e.g., use lists for multiple items).

Our site base URL is ${baseURL}. Always produce absolute links using this base.

Here’s how to use your tools and link users correctly:
- Unified Inventory (Preferred for books): Use \`search_inventory\` for book/ebook/title queries; it searches both products and e-books.
  - Products: \`[Product Name](${baseURL}/products/[category]/[id])\`.
  - E-books: There’s no individual e-book page; send users to the listing: \`${baseURL}/products/ebooks\`. Note if it’s **Free** or show the price.
- Products Only: Use \`check_product_availability\` for computers/accessories. Link: \`[Product Name](${baseURL}/products/[category]/[id])\`.
- E-books Only (fallback): Use \`find_ebook\` if specifically asked and unified search wasn’t used. Link users to \`${baseURL}/products/ebooks\`.
- Blog Posts: Use \`find_post\`; link: \`[Post Title](${baseURL}/posts/[post-id])\`.

Answer style and behavior:
- Keep answers under ~120 words unless asked; use short sentences and bullets for lists.
- When nothing is found, ask 1–2 clarifying questions (author, topic, edition) before apologizing.
- Offer helpful alternatives (similar titles or categories) and clear next actions (e.g., “Go to E-books”).

Compact FAQ you can reference in replies:
- Returns & Warranty: Most products have a 7-day return window if unused and in original packaging. Manufacturer warranties apply to computers/accessories; we’ll guide claims.
- Delivery: Local deliveries 1–3 business days; international varies by carrier and destination.
- Payments: Cards and bank transfers supported. Student discounts available on select items.
- Business Center: Printing, editing, and project analysis with quick turnaround. Files can be uploaded; quotes provided on request.
- Support: 24/7 chat; in-store at Shop 4 & 5, Behind Faculty of CIS, University of Ilorin PS, Ilorin, Nigeria.

If you can't find something, be friendly and suggest alternatives or ask them to check back later. Never show the raw data from the tools.

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
  // Load saved conversation if present, otherwise initialize with greeting
    if (typeof window !== 'undefined') {
      const saved = loadSavedMessages()
      const savedTheme = loadSavedTheme()
      setIsChatDark(!!savedTheme)
      const sessionToken = getOrCreateSessionToken()
      // Fetch from server if available
      fetch(`/api/customer-support/sessions?session_token=${sessionToken}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.messages && data.messages.length) {
            // map server rows to Message[]
            const msgs = data.messages.map((m: any, idx: number) => ({ id: m.id?.toString() || `s_${idx}`, text: m.message, sender: m.role === 'user' ? 'user' : 'bot', timestamp: new Date(m.created_at) }))
            setMessages(msgs)
          } else if (saved && saved.length > 0) {
            setMessages(saved)
          } else {
            setMessages([
              {
                id: "1",
                text: "Hello! I'm Sm@rtz CS, your virtual assistant. How can I help you today? 😊",
                sender: "bot",
                timestamp: new Date(),
              },
            ])
          }
        })
        .catch(() => {
          if (saved && saved.length > 0) setMessages(saved)
        })
      // if user is logged in, associate session token to user_id so history follows across devices
      try {
        const sessionToken = getOrCreateSessionToken()
        const user = await supabase.auth.getUser()
        const userId = (user?.data?.user?.id) || null
        if (userId) {
          try {
            const resp = await fetch('/api/customer-support/associate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_token: sessionToken, user_id: userId }) })
            const json = await resp.json().catch(() => null)
            if (json?.canonical_token) {
              // replace local anonymous token with canonical user token
              localStorage.setItem(SESSION_KEY, json.canonical_token)
              // retry pending messages (they will be posted under canonical token)
              retryPending()
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore if auth not available
      }
    }
  // Show helpful quick suggestions on open
  setSuggestions(['Browse E-books', 'Browse Computers', 'See new arrivals', 'Contact support'])
  }

  useEffect(() => {
    if (isOpen) {
      startChatSession()
    } else {
      // Reset chat when closed
  setChat(null)
  setMessages([])
  setIsMaximized(false)
      // ensure any scroll lock is removed
      try { document.body.style.overflow = '' } catch (e) {}
    }
  }, [isOpen])

  // ensure overflow is reset on unmount
  useEffect(() => {
    return () => { try { document.body.style.overflow = '' } catch (e) {} }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loadingMessage])

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      // Trim to MAX_HISTORY to avoid unbounded growth
      const toSave = messages.slice(-MAX_HISTORY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch (e) {
      console.warn('Failed to save chat messages', e)
    }
  }, [messages])

  // Persist theme
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, isChatDark ? 'dark' : 'light')
    } catch (e) {
      // ignore
    }
  }, [isChatDark])

  // Prevent background scroll when maximized
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isMaximized) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMaximized])

  const clearConversation = () => {
    // open confirmation modal
    setShowClearConfirm(true)
  }

  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const confirmClear = async () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch (e) {}
    const sessionToken = localStorage.getItem('smrtz_chat_session_token')
    if (sessionToken) {
      await fetch(`/api/customer-support/messages?session_token=${sessionToken}`, { method: 'DELETE' }).catch(() => {})
    }
    setMessages([])
    setShowClearConfirm(false)
  }

  const cancelClear = () => setShowClearConfirm(false)

  // helper for optimistic POST with retries
  const postWithRetry = async (url: string, body: any, retries = 2) => {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('bad status')
      return res.json()
    } catch (e) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, 2 - retries)))
        return postWithRetry(url, body, retries - 1)
      }
  console.warn('postWithRetry failed, queuing pending', e)
  // Ensure queued payload contains clientMessageId so we can track per-message pending state
  try {
    if (body && body.clientMessageId) {
      // mark this id as pending in UI
      setPendingIds((p) => Array.from(new Set([...p, body.clientMessageId])))
    }
    addPendingMessage(body)
  } catch (err) { console.warn('failed to queue pending', err) }
  return null
    }
  }

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
    // persist user message to server
    try {
      const sessionToken = getOrCreateSessionToken()
      // optimistic POST with retry. include clientMessageId for tracking if it gets queued
      postWithRetry('/api/customer-support/messages', { session_token: sessionToken, role: 'user', message: userMessage.text, created_at: userMessage.timestamp.toISOString(), clientMessageId: userMessage.id })
    } catch (e) { }

    // Command-style quick actions (support, browsing, recommendations)
    const BASE = getBaseUrl()
    const normalized = textToSend.trim().toLowerCase()
    const replyAndStop = (text: string, newSuggestions?: string[]) => {
      typeBotResponse(text)
      if (newSuggestions) setSuggestions(newSuggestions)
    }
    if (/(contact (us|support)|support|help center|customer support)/i.test(normalized)) {
      replyAndStop(`You can reach our support team anytime:\n\n- [Chat support](${BASE}/support)\n- [Contact page](${BASE}/contact)\n\nIf you prefer in-store help: Shop 4 & 5, Behind Faculty of CIS, University of Ilorin PS, Ilorin, Nigeria.`, ['Browse E-books', 'Browse Computers', 'See new arrivals'])
      return
    }
    if (/(browse e-?books|go to e-?books)/i.test(normalized)) {
      replyAndStop(`Explore our full E-book collection here: ${BASE}/products/ebooks`, ['Show similar titles', 'See new arrivals', 'Contact support'])
      return
    }
    if (/(browse computers|computers)/i.test(normalized)) {
      replyAndStop(`Browse computers and accessories: ${BASE}/products/computers`, ['See new arrivals', 'Contact support'])
      return
    }
    if (/(browse books|books( category)?)/i.test(normalized)) {
      replyAndStop(`Browse our books selection: ${BASE}/products/books`, ['Show similar titles', 'See new arrivals', 'Contact support'])
      return
    }
    if (/(business center|business services)/i.test(normalized)) {
      replyAndStop(`You can request printing, editing, or analysis services here: ${BASE}/business-center`, ['Contact support'])
      return
    }
    if (/(see|show) new arrivals/i.test(normalized)) {
      setLoadingMessage('Fetching new arrivals... 🆕')
      try {
        const data = await toolFunctions.recommendations()
        const recText = buildRecommendationsReply(data)
        replyAndStop(recText || 'No new arrivals at the moment. Please check back soon.', ['Browse E-books', 'Browse Computers', 'Contact support'])
      } finally {
        setLoadingMessage(null)
      }
      return
    }

    // Heuristic: proactively search inventory for quoted titles or book-like queries before calling the model.
    const extractQuoted = (txt: string) => {
      const matches = [...txt.matchAll(/"([^"]{2,100})"/g)].map(m => m[1].trim())
      return Array.from(new Set(matches))
    }
    const looksLikeBookQuery = (txt: string) => {
      const lower = txt.toLowerCase()
      return /book|ebook|novel|author|do you have|find|looking for/.test(lower) || extractQuoted(txt).length > 0
    }
    const quoted = extractQuoted(textToSend)

  const buildInventoryReply = (query: string, result: any) => {
      const BASE = getBaseUrl()
      const parts: string[] = []
      if (result.products) {
        parts.push(`**Products matching "${query}"**:`)
        result.products.forEach((p: any) => {
          const inStock = (p.stock_quantity ?? 0) > 0 ? `In stock: ${p.stock_quantity}` : 'Out of stock'
          // Products detail pages use /products/[category]/[id]
          parts.push(`- [${p.name}](${BASE}/products/${p.category}/${p.id}) — ${formatPrice(Number(p.price))} • ${inStock}`)
        })
      }
      if (result.ebooks) {
        parts.push(`**E-books matching "${query}"**:`)
        result.ebooks.forEach((e: any) => {
          const pricePart = e.is_free ? '**Free**' : `${formatPrice(Number(e.price))}`
          // Ebooks listing lives at /products/ebooks (no individual [id] page); guide user there
          parts.push(`- ${e.title} by ${e.author || 'Unknown Author'} — ${pricePart} • See all e-books: ${BASE}/products/ebooks`)
        })
      }
      return parts.join('\n')
    }

    if (looksLikeBookQuery(textToSend)) {
      setLoadingMessage('Searching inventory... 🔍')
      try {
    const queries = quoted.length > 0 ? quoted : [textToSend.replace(/^(do you have|have you got|find|search for)\s+/i, '').replace(/\?+$/, '').trim()]
        const aggregatedResponses: string[] = []
        let anyHit = false
        for (const q of queries) {
          if (!q) continue
            const res = await toolFunctions.search_inventory({ query: q })
            if ((res as any).products || (res as any).ebooks) {
              anyHit = true
              aggregatedResponses.push(buildInventoryReply(q, res))
        setLastQuery(q)
            }
        }
        if (anyHit) {
      setSuggestions(['Show similar titles', 'See new arrivals', 'Go to E-books'])
      const reply = aggregatedResponses.join('\n\n') + `\n\nWould you like me to show similar titles or new arrivals? I can also take you to the full E-books section. 😊`
          typeBotResponse(reply)
          setLoadingMessage(null)
          return // Skip model; we already answered.
        }
      } catch (e) {
        console.warn('Proactive inventory search failed, falling back to model', e)
      } finally {
        setLoadingMessage(null)
      }
    }

    setLoadingMessage("Thinking... 🤔")

    try {
      const prompt = `${attachment ? `The user has shared a file: ${attachment.name} (${attachment.type})` : ""} ${textToSend}`
      let result = await chat.sendMessage(prompt)

  while (true) {
        const response = await result.response
        const functionCalls = response.functionCalls()

        if (!functionCalls || functionCalls.length === 0) {
      const text = response.text()
          // Fallback: if model says it cannot find but we haven't tried unified search yet, attempt once.
          if (/couldn't find|cannot find|not find/i.test(text) && !/suggest/i.test(text) && looksLikeBookQuery(textToSend)) {
            try {
              setLoadingMessage('Double-checking our inventory... 🔄')
              const key = quoted[0] || textToSend
              const res = await toolFunctions.search_inventory({ query: key })
              if ((res as any).products || (res as any).ebooks) {
                const reply = buildInventoryReply(key, res) + '\n\nFound it on a second look! Anything else you need? 😄'
                typeBotResponse(reply)
        setSuggestions(['Show similar titles', 'See new arrivals', 'Go to E-books'])
                break
              }
            } catch (e) {
              console.warn('Secondary inventory re-check failed', e)
            }
          }
          typeBotResponse(text)
          break
        }

        const call = functionCalls[0]
        let apiResponse

        // Helper to simulate search delay for UX polish
        const simulateDelay = async () => new Promise(res => setTimeout(res, 1200))

    if (call.name === 'search_inventory') {
          const args = call.args as { query: string }
            if (args.query) setLoadingMessage(`Searching our inventory for "${args.query}"... 🔍`)
            await simulateDelay()
            apiResponse = await toolFunctions.search_inventory(args)
      setLastQuery(args.query)
    } else if (call.name === 'check_product_availability') {
          const args = call.args as { productName: string }
      if (args.productName) setLoadingMessage(`Checking product availability for "${args.productName}"... 🛒`)
            await simulateDelay()
            apiResponse = await toolFunctions.check_product_availability(args)
            // Fallback: if no products found & looks like a book query, try ebooks automatically
            if ((apiResponse as any)?.message && /book|novel|ebook|text/i.test(args.productName)) {
              setLoadingMessage(`Didn't spot it in products, checking e-books... 📖`)
              await simulateDelay()
              apiResponse = await toolFunctions.find_ebook({ ebookTitle: args.productName })
            }
        } else if (call.name === 'find_post') {
          const args = call.args as { postTitle: string }
            if (args.postTitle) setLoadingMessage(`Searching our blog for "${args.postTitle}"... 📚`)
            await simulateDelay()
            apiResponse = await toolFunctions.find_post(args)
        } else if (call.name === 'find_ebook') {
          const args = call.args as { ebookTitle: string }
            if (args.ebookTitle) setLoadingMessage(`Looking up e-book "${args.ebookTitle}"... 📖`)
            await simulateDelay()
            apiResponse = await toolFunctions.find_ebook(args)
            setLastQuery(args.ebookTitle)
        } else if (call.name === 'similar_titles') {
          const args = call.args as { query: string }
            if (args.query) setLoadingMessage(`Finding similar titles to "${args.query}"... ✨`)
            await simulateDelay()
            apiResponse = await toolFunctions.similar_titles(args)
        } else if (call.name === 'recommendations') {
            setLoadingMessage('Pulling fresh picks... 🆕')
            await simulateDelay()
            apiResponse = await toolFunctions.recommendations()
        } else {
          throw new Error(`Unknown tool: ${call.name}`)
        }

        result = await chat.sendMessage([
          {
            functionResponse: {
              name: call.name,
              response: apiResponse,
            },
          },
        ])
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

  const buildRecommendationsReply = (data: any) => {
    const BASE = getBaseUrl()
    const parts: string[] = []
    if (data?.newProducts?.length) {
      parts.push('**New arrivals — Products**:')
      data.newProducts.slice(0, 5).forEach((p: any) => {
        const category = p.category || 'books'
        parts.push(`- [${p.name}](${BASE}/products/${category}/${p.id}) — ${formatPrice(Number(p.price))}`)
      })
    }
    if (data?.newEbooks?.length) {
      if (parts.length) parts.push('')
      parts.push('**New arrivals — E-books**:')
      data.newEbooks.slice(0, 5).forEach((e: any) => {
        const pricePart = e.is_free ? '**Free**' : `${formatPrice(Number(e.price))}`
        parts.push(`- ${e.title} by ${e.author || 'Unknown Author'} — ${pricePart} • [Browse E-books](${BASE}/products/ebooks)`)
      })
    }
    return parts.join('\n')
  }

  // Typewriter effect for bot messages
  const typeBotResponse = (fullText: string) => {
    const id = (Date.now() + Math.random()).toString()
    const newMessage: Message = { id, text: "", sender: 'bot', timestamp: new Date() }
    setMessages(prev => [...prev, newMessage])
    let index = 0
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
    typingIntervalRef.current = setInterval(() => {
      index++
      setMessages(prev => prev.map(m => m.id === id ? { ...m, text: fullText.slice(0, index) } : m))
      if (index >= fullText.length) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
        // once finished, persist the completed bot message to server (with retry) and include clientMessageId
        try {
          const sessionToken = getOrCreateSessionToken()
          postWithRetry('/api/customer-support/messages', { session_token: sessionToken, role: 'bot', message: fullText, created_at: new Date().toISOString(), clientMessageId: id })
        } catch (e) {}
      }
    }, 18) // ~55 chars/sec
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      // Quick replies handling
      const trimmed = inputValue.trim().toLowerCase()
      if (trimmed === 'show similar titles' || trimmed === 'similar titles') {
        if (lastQuery) {
          setSuggestions([])
          sendMessage(`Show similar titles for "${lastQuery}"`)
          return
        }
      } else if (trimmed === 'see new arrivals' || trimmed === 'new arrivals') {
        setSuggestions([])
        sendMessage('Show new arrivals')
        return
      } else if (trimmed === 'go to e-books' || trimmed === 'ebooks') {
        setSuggestions([])
        const BASE = getBaseUrl()
        typeBotResponse(`You can explore all our e-books here: ${BASE}/products/ebooks`)
        setInputValue('')
        return
      }
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
            onClick={() => toggleOpen()}
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
            className={`fixed z-50 ${isMaximized ? 'inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]' : 'bottom-32 right-6 w-80 sm:w-96 h-[500px] max-h-[80vh]'}`}
          >
            {/* Overlay backdrop when maximized */}
            {isMaximized && (
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setIsMaximized(false)}
                aria-hidden
              />
            )}
            <Card className={`h-full flex flex-col backdrop-blur-lg border shadow-2xl ${isChatDark ? 'bg-gray-900 text-white' : 'bg-white/90 dark:bg-black/90'}`}>
              {/* Header */}
              <motion.div layout className={`flex items-center justify-between p-4 border-b ${isChatDark ? 'bg-gray-900 text-white' : 'bg-primary text-white'} rounded-t-lg`}>
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
                <div className="flex items-center space-x-2">
                  {/* pending sync badge */}
                  {isRetrying ? (
                    <div className="relative" title="Syncing pending messages...">
                      <svg className="h-5 w-5 text-yellow-400 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                        <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  ) : pendingCount > 0 && (
                    <div className="relative" title={`${pendingCount} messages pending sync`}>
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    </div>
                  )}

                  <button
                    onClick={clearConversation}
                    className="text-xs bg-transparent text-white/80 hover:text-white px-2 py-1 rounded"
                    title="Clear conversation"
                  >
                    Clear
                  </button>

                  {/* Theme toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsChatDark((s) => !s)}
                    className="text-white hover:bg-white/20 h-8 w-8"
                    aria-label="Toggle chat theme"
                    title="Toggle theme"
                  >
                    {isChatDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="text-white hover:bg-white/20 h-8 w-8"
                    aria-label={isMaximized ? 'Minimize chat' : 'Maximize chat'}
                    title={isMaximized ? 'Minimize' : 'Maximize'}
                  >
                    {isMaximized ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => closeChat()}
                    className="text-white hover:bg-white/20 h-8 w-8"
                    aria-label="Close chat"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
              {/* Quick suggestions */}
              {suggestions.length > 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setInputValue(s)
                        setSuggestions([])
                        sendMessage(s)
                      }}
                      className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-muted/80 border"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div className={`flex-1 p-4 space-y-4 overflow-y-auto ${isChatDark ? 'bg-gray-900' : 'bg-background'}`}>
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
                      <div className="prose prose-sm dark:prose-invert max-w-full break-words">
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => (
                              <a {...props} className="text-primary underline hover:opacity-80" />
                            ),
                          }}
                        >
                          {message.text}
                        </ReactMarkdown>
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === "user" ? "text-white/70" : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {pendingIds.includes(message.id) && (
                          <span title="Syncing..." className="inline-flex items-center ml-2">
                            <svg className="h-4 w-4 text-yellow-400 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"></path>
                            </svg>
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // clear saved history
                          try { localStorage.removeItem(STORAGE_KEY) } catch (e) {}
                          setMessages([])
                        }}
                        className="text-xs bg-transparent text-gray-400 hover:text-red-500 px-2 py-1 rounded"
                        title="Clear conversation"
                      >
                        Clear
                      </button>
                    </div>
                  </motion.div>
                ))}
                {loadingMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className={`${isChatDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-card border'} px-4 py-3 rounded-2xl rounded-bl-md shadow-sm`}>
                      <div className={`flex items-center space-x-3 text-sm ${isChatDark ? 'text-white/85' : 'text-muted-foreground'}`}>
                        <Search className="h-4 w-4 animate-spin-slow" />
                        <p className="whitespace-pre-line">{loadingMessage}</p>
                        <div className="flex space-x-1 ml-1">
                          <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce"></span>
                        </div>
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
                        aria-label="Attach a file"
                        title="Attach a file"
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
