import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:you@example.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

export async function broadcastPush(opts: { title: string; message: string; url?: string; imageUrl?: string; persist?: boolean }) {
  const { title, message, url, imageUrl, persist = true } = opts

  // persist push message if requested
  if (persist) {
    try {
      await supabaseAdmin.from('push_messages').insert([{ title, message, payload: { imageUrl, url } }])
    } catch (e) {
      console.warn('failed to persist push message', e)
    }
  }

  // fetch subscribers via REST to bypass RLS reliably
  const subsRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscribers?select=*`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
    },
  })

  if (!subsRes.ok) {
    throw new Error('failed to fetch subscribers')
  }

  const subs = await subsRes.json()

  const results: any[] = []
  for (const s of subs) {
    try {
      const payload = { title, body: message, url: url || '/', icon: imageUrl || '/logo.png' }
      await webpush.sendNotification(s.subscription, JSON.stringify(payload))
      results.push({ id: s.id, ok: true })
    } catch (e) {
      results.push({ id: s.id, ok: false, error: String(e) })
    }
  }

  return { ok: true, results }
}
