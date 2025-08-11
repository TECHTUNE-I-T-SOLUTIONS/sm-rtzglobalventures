import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(price)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

// Derive absolute base URL for links in both server and client contexts
export function getBaseUrl(): string {
  // Prefer explicit envs
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL

  if (envUrl) {
    // Ensure protocol
    if (/^https?:\/\//i.test(envUrl)) return envUrl.replace(/\/$/, '')
    return `https://${envUrl.replace(/\/$/, '')}`
  }

  // Browser fallback
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.host}`
  }

  // Local dev default
  return 'http://localhost:3000'
}
