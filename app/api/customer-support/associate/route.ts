import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { session_token, user_id } = body
    if (!session_token || !user_id) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    // Migrate anonymous session messages into a canonical per-user session token
    const canonical = `user_${user_id}`

    // 1) Update messages with anonymous session_token to the canonical token
    const { error: updErr } = await supabase
      .from('customer_support_chats')
      .update({ session_token: canonical })
      .eq('session_token', session_token)

    if (updErr) {
      console.error('failed to migrate messages', updErr)
      return NextResponse.json({ error: 'db error' }, { status: 500 })
    }

    // 2) Upsert canonical mapping
    const { error: upsertErr } = await supabase.from('customer_support_sessions').upsert({ session_token: canonical, user_id, updated_at: new Date().toISOString() }, { onConflict: 'session_token' })
    if (upsertErr) {
      console.error('associate upsert error', upsertErr)
      return NextResponse.json({ error: 'db error' }, { status: 500 })
    }

    // Optionally remove anonymous mapping if present
    await supabase.from('customer_support_sessions').delete().eq('session_token', session_token).neq('session_token', canonical)

    return NextResponse.json({ ok: true, canonical_token: canonical })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
