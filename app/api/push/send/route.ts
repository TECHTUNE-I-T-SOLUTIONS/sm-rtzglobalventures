import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BG6N6ZcLHOz0vc8VlpQXaLFruDZltsD7Duh_QdlWHdBwMxq5_A1okycFqGz06VML0ffGnlpfXjxxKx_NYXCAmpk'
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'Nwpflga9P9OCSHrLo7KXW7ql-L8uuW7pQxfy_Lr55hc'
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:you@example.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function requireAdmin(req: NextRequest) {
  // Expect Authorization: Bearer <user_jwt>
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return { ok: false, status: 401, message: 'missing authorization header' }
  const parts = authHeader.split(' ')
  if (parts.length !== 2) return { ok: false, status: 401, message: 'invalid authorization header' }
  const token = parts[1]

  // Verify token by calling Supabase auth endpoint
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token as string)
    if (error || !data?.user) return { ok: false, status: 401, message: 'invalid token' }
    const userId = data.user.id

    // fetch profile role
    const { data: profiles, error: pErr } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).limit(1)
    if (pErr) return { ok: false, status: 500, message: 'failed to fetch profile' }
    const role = profiles?.[0]?.role || null
    if (role !== 'admin') return { ok: false, status: 403, message: 'admin required' }
    return { ok: true, userId }
  } catch (e) {
    return { ok: false, status: 500, message: String(e) }
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status })

    const body = await req.json()
    const { title, message, url, html, imageUrl, skipPersist } = body

    // persist message record to push_messages (server role) unless client requested skip
    if (!skipPersist) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/push_messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_SERVICE_ROLE,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`
          },
          body: JSON.stringify({ title, message, payload: { html, imageUrl } })
        })
      } catch (e) {
        console.warn('failed to persist push message', e)
      }
    }

    // fetch subscribers from Supabase
    const subsRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscribers?select=*`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`
      }
    })
    if (!subsRes.ok) throw new Error('failed to fetch subscribers')
    const subs = await subsRes.json()
    const results: any[] = []
    for (const s of subs) {
      try {
        const payload = { title, body: message, url: url || '/', icon: imageUrl || '/logo.png', html }
        await webpush.sendNotification(s.subscription, JSON.stringify(payload))
        results.push({ id: s.id, ok: true })
      } catch (e) {
        results.push({ id: s.id, ok: false, error: String(e) })
      }
    }
    return NextResponse.json({ ok: true, results })
  } catch (e) {
    console.error('send push error', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
