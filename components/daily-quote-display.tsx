"use client"

import { useEffect, useState } from "react"
import { DailyQuoteModal } from "@/components/modals/daily-quote-modal"
import toast from "react-hot-toast"

interface Quote {
  id: string;
  title: string;
  content: string;
  author: string;
  references: string;
}

export function DailyQuoteDisplay() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await fetch("/quotes.json")
        if (!res.ok) {
          throw new Error(`Failed to fetch quotes: ${res.statusText}`)
        }
        const data: Quote[] = await res.json()
        setQuotes(data)
      } catch (error: any) {
        console.error("Error fetching quotes:", error)
        toast.error("Failed to load daily quotes.")
      }
    }
    fetchQuotes()
  }, [])

  useEffect(() => {
    if (quotes.length > 0) {
      const lastShownDate = localStorage.getItem("dailyQuoteLastShownDate")
      const today = new Date().toDateString()

      if (lastShownDate !== today) {
        // It's a new day, show a new quote
        const lastQuoteId = localStorage.getItem("dailyQuoteId")
        let selectedQuote: Quote | null = null

        // Try to get a different quote than yesterday
        const availableQuotes = quotes.filter(q => q.id !== lastQuoteId)
        if (availableQuotes.length > 0) {
          selectedQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)]
        } else {
          // If all quotes were shown, just pick a random one
          selectedQuote = quotes[Math.floor(Math.random() * quotes.length)]
        }
        
        setCurrentQuote(selectedQuote)
        setIsOpen(true)
        localStorage.setItem("dailyQuoteLastShownDate", today)
        localStorage.setItem("dailyQuoteId", selectedQuote.id)
      } else {
        // Already shown today, but set currentQuote in case it's needed for re-render
        const storedQuoteId = localStorage.getItem("dailyQuoteId")
        const storedQuote = quotes.find(q => q.id === storedQuoteId)
        if (storedQuote) {
          setCurrentQuote(storedQuote)
        }
      }
    }
  }, [quotes])

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <DailyQuoteModal
      isOpen={isOpen}
      onClose={handleClose}
      quote={currentQuote}
    />
  )
}
