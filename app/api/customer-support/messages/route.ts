import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

const SERVER_MAX_HISTORY = 1000

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { session_token, role, message, created_at } = body
    if (!session_token || !role || typeof message === 'undefined') {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    const payload = {
      session_token,
      role,
      message,
      created_at: created_at || new Date().toISOString(),
    }

    const { error } = await supabase.from('customer_support_chats').insert([payload])
    if (error) {
      console.error('supabase insert message error', error)
      return NextResponse.json({ error: 'db error' }, { status: 500 })
    }

    // Trim older messages beyond SERVER_MAX_HISTORY
    const { data: idsToDelete, error: selErr } = await supabase
      .from('customer_support_chats')
      .select('id')
      .eq('session_token', session_token)
      .order('created_at', { ascending: false })
      .range(SERVER_MAX_HISTORY, 100000)

    if (selErr) {
      console.warn('failed to select old messages to trim', selErr)
    } else if (idsToDelete && idsToDelete.length) {
      const ids = idsToDelete.map((r: any) => r.id)
      const { error: delErr } = await supabase.from('customer_support_chats').delete().in('id', ids)
      if (delErr) console.warn('failed to delete old messages', delErr)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const session_token = searchParams.get('session_token')
    if (!session_token) return NextResponse.json({ error: 'missing session_token' }, { status: 400 })

    const { error } = await supabase.from('customer_support_chats').delete().eq('session_token', session_token)
    if (error) {
      console.error('supabase delete messages error', error)
      return NextResponse.json({ error: 'db error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
