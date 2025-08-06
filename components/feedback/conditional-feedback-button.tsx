"use client"

import { usePathname } from "next/navigation"
import { FeedbackButton } from "./feedback-button"

export function ConditionalFeedbackButton() {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')
  
  if (isAdminPage) {
    return null
  }
  
  return <FeedbackButton />
} 