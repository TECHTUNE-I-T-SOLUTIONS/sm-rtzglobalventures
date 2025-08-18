"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Bell } from 'lucide-react'

export default function PushSubscribeModal() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const countdownRef = useRef<number | null>(null)
  const { toast: useToastFn } = useToast()

  useEffect(() => {
    // Check existing subscription
    const check = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        if (!reg) return setIsSubscribed(false)
        const sub = await reg.pushManager.getSubscription()
        setIsSubscribed(!!sub)
      } catch (e) {
        console.error('check subscription failed', e)
      }
    }
    check()

    // If not subscribed, open the modal after short delay (so it's not intrusive immediately)
    const dismissed = localStorage.getItem('push_prompt_dismissed') === '1'
    // do not show for admins, already subscribed users, or dismissed users
    if (user?.user_metadata?.role === 'admin') return
    const t = setTimeout(() => {
      if (!isSubscribed && !dismissed) setIsOpen(true)
    }, 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (showThankYou) {
      setCountdown(5)
      countdownRef.current = window.setInterval(() => {
        setCountdown((c) => c - 1)
      }, 1000) as unknown as number
    }
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }
  }, [showThankYou])

  useEffect(() => {
    if (countdown <= 0 && showThankYou) {
      setIsOpen(false)
      setShowThankYou(false)
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }
  }, [countdown, showThankYou])

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const triggerSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      useToastFn({ title: 'Push not supported in this browser' })
      return
    }
    try {
      setIsSubscribing(true)
      const reg = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BG6N6ZcLHOz0vc8VlpQXaLFruDZltsD7Duh_QdlWHdBwMxq5_A1okycFqGz06VML0ffGnlpfXjxxKx_NYXCAmpk')
        })
        // send subscription to server
        await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub }) })
        // show toast
        toast.success('Subscribed to notifications')
        setIsSubscribed(true)
          // mark dismissed so modal doesn't show again
          try { localStorage.setItem('push_prompt_dismissed', '1') } catch (e) {}
        // send automated welcome push via server
        try {
          // call welcome endpoint with subscription so user gets immediate push
          await fetch('/api/push/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: sub, title: 'Welcome!', message: 'Thanks for subscribing to Sm@rtz Global Ventures notifications.' })
          })
        } catch (e) {
          console.warn('welcome push failed', e)
        }
        // show thank you modal content
        setShowThankYou(true)
      } else if (permission === 'denied') {
        useToastFn({ title: 'Notifications blocked', description: 'Please enable notifications in your browser settings.' })
      }
    } catch (e) {
      console.error('subscribe error', e)
      useToastFn({ title: 'Subscription failed' })
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleClose = () => {
    try { localStorage.setItem('push_prompt_dismissed', '1') } catch (e) {}
    setIsOpen(false)
  }

  const handleUnsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) return
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return
      const endpoint = (sub as any).endpoint
      // remove from server
      await fetch('/api/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint }) })
      // unsubscribe in browser
      await sub.unsubscribe()
      setIsSubscribed(false)
      try { localStorage.removeItem('push_prompt_dismissed') } catch (e) {}
      useToastFn({ title: 'Unsubscribed from notifications' })
    } catch (e) {
      console.error('unsubscribe failed', e)
      useToastFn({ title: 'Failed to unsubscribe' })
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && !isSubscribed && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[9999]"
              onClick={() => handleClose()}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            >
              <Card className="w-full max-w-md bg-white dark:bg-black">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Get Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showThankYou ? (
                    <div>
                      <p className="text-sm text-muted-foreground">Stay updated with new products, offers and ebooks. Enable browser notifications to receive timely updates.</p>
                      <div className="flex gap-2 justify-end mt-4">
                        <Button variant="outline" onClick={() => handleClose()}>Close</Button>
                        <Button onClick={triggerSubscribe} disabled={isSubscribing}>
                          {isSubscribing ? 'Subscribing...' : 'Enable Notifications'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm">Thank you! Notifications are enabled.</p>
                      <p className="text-xs text-muted-foreground">This modal will close in {countdown} seconds.</p>
                      <div className="flex gap-2 justify-end mt-4">
                        <Button variant="outline" onClick={() => { handleClose(); setShowThankYou(false) }}>Close Now</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
