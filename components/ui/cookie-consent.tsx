"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./button"
import { Cookie } from "lucide-react"
import Cookies from "js-cookie"

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    const consent = Cookies.get("cookie-consent")
    if (!consent) {
      setShowConsent(true)
    }
  }, [])

  const acceptCookies = () => {
    Cookies.set("cookie-consent", "accepted", { expires: 365 })
    setShowConsent(false)
  }

  const declineCookies = () => {
    Cookies.set("cookie-consent", "declined", { expires: 365 })
    setShowConsent(false)
  }

  return (
    <AnimatePresence>
      {showConsent && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Cookie className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    We use cookies to enhance your experience on our website. By continuing to use this site, you agree
                    to our use of cookies.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={declineCookies}>
                  Decline
                </Button>
                <Button size="sm" onClick={acceptCookies}>
                  Accept
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
