import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const subscription = body.subscription
    if (!subscription) return NextResponse.json({ ok: false, error: 'missing subscription' }, { status: 400 })

  // Save to Supabase via direct REST call using service role key
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/push_subscribers`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`
      },
      body: JSON.stringify({ subscription })
    })
    if (!res.ok) {
      const txt = await res.text()
      return NextResponse.json({ ok: false, error: txt }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('subscribe error', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
