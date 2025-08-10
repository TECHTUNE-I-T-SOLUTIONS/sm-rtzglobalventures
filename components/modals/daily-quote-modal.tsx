"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Share2, Copy } from "lucide-react"
import toast from "react-hot-toast"

interface Quote {
  id: string;
  title: string;
  content: string;
  author: string;
  references: string;
}

interface DailyQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
}

export function DailyQuoteModal({ isOpen, onClose, quote }: DailyQuoteModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || !isOpen || !quote) return null

  const modalRoot = document.getElementById("modal-root")

  if (!modalRoot) {
    console.error("Modal root element not found. Make sure a div with id='modal-root' exists in your DOM.")
    return null
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`"${quote.content}" - ${quote.author}`)
      toast.success("Quote copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy: ", err)
      toast.error("Failed to copy quote.")
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: quote.title,
          text: `"${quote.content}" - ${quote.author}\n\n${quote.references}`,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing: ", error)
        toast.error("Failed to share quote.")
      }
    } else {
      // Fallback for browsers that do not support the Web Share API
      handleCopy()
      toast.error("Web Share API not supported. Quote copied to clipboard instead.")
    }
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center p-4"
          onClick={onClose} // Close modal when clicking outside
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md rounded-lg shadow-lg bg-white dark:bg-black"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <Card className="bg-white dark:bg-black border-none shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold text-primary">{quote.title}</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base italic leading-relaxed">
                  "{quote.content}"
                </CardDescription>
                <p className="text-sm font-semibold text-right">- {quote.author}</p>
                <p className="text-xs text-muted-foreground text-right">{quote.references}</p>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-2" /> Copy
                  </Button>
                  <Button variant="default" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" /> Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    modalRoot
  )
}