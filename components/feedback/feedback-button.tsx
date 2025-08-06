"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/hooks/use-auth"
import { MessageSquare, Star, X, Send, HelpCircle } from "lucide-react"
import toast from "react-hot-toast"

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState("")
  const [category, setCategory] = useState("general")
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuthStore()

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to submit feedback")
      return
    }

    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    if (!message.trim()) {
      toast.error("Please enter a message")
      return
    }

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from("feedback")
        .insert({
          user_id: user.id,
          rating,
          message: message.trim(),
          category,
        })

      if (error) throw error

      toast.success("Feedback submitted successfully!")
      setRating(0)
      setMessage("")
      setCategory("general")
      setIsOpen(false)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast.error("Failed to submit feedback")
    } finally {
      setSubmitting(false)
    }
  }

  const categories = [
    { value: "general", label: "General" },
    { value: "product", label: "Product" },
    { value: "service", label: "Service" },
    { value: "website", label: "Website" },
    { value: "support", label: "Support" },
  ]

  return (
    <>
      {/* Floating Feedback Button */}
      <div className="fixed bottom-20 left-4 z-40 group">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          size="icon"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Share Feedback
        </div>
      </div>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-gray-800 border w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Share Your Feedback</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rating */}
              <div>
                <p className="text-sm font-medium mb-2">Rate your experience:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="text-sm font-medium mb-2">Category:</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Badge
                      key={cat.value}
                      variant={category === cat.value ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setCategory(cat.value)}
                    >
                      {cat.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="text-sm font-medium mb-2">Your message:</p>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your experience..."
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={submitting || rating === 0 || !message.trim()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
} 