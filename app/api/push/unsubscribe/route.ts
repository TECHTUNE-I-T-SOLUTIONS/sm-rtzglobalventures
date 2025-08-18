import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { endpoint } = body
    if (!endpoint) return NextResponse.json({ ok: false, error: 'missing endpoint' }, { status: 400 })

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/push_subscribers?endpoint=eq.${encodeURIComponent(endpoint)}`
    // delete via service role
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`
      }
    })
    if (!res.ok) {
      const txt = await res.text()
      return NextResponse.json({ ok: false, error: txt }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('unsubscribe error', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
