import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:you@example.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subscription, title = 'Welcome', message = 'Thanks for subscribing!' } = body
    if (!subscription) return NextResponse.json({ ok: false, error: 'missing subscription' }, { status: 400 })

    const payload = { title, body: message, url: '/', icon: '/logo.png' }
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload))
      return NextResponse.json({ ok: true })
    } catch (e) {
      console.error('webpush send failed', e)
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
    }
  } catch (e) {
    console.error('welcome push error', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
