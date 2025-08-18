"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

export default function PushSubscribeButton() {
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const { toast } = useToast()

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

  const registerAndSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser.')
      return
    }
    try {
      setIsSubscribing(true)
      const reg = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array('BG6N6ZcLHOz0vc8VlpQXaLFruDZltsD7Duh_QdlWHdBwMxq5_A1okycFqGz06VML0ffGnlpfXjxxKx_NYXCAmpk')
        })
        // send subscription to server
        await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub }) })
        toast({ title: 'Subscribed to notifications' })
      } else if (permission === 'denied') {
        setShowBlockedModal(true)
      }
    } catch (e) {
      console.error('subscribe error', e)
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={registerAndSubscribe} title="Subscribe to notifications" className="p-1 sm:p-2">
        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="sr-only">Subscribe</span>
      </Button>

      <ConfirmationModal
        isOpen={showBlockedModal}
        onClose={() => setShowBlockedModal(false)}
        onConfirm={() => setShowBlockedModal(false)}
        title="Enable notifications"
        message="Notifications are blocked for this site. Please enable notifications in your browser settings (Site settings → Notifications) to receive updates."
        confirmText="OK"
      />
    </>
  )
}
