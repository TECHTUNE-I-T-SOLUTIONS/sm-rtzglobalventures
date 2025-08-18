import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const session_token = searchParams.get('session_token')
    if (!session_token) return NextResponse.json({ error: 'missing session_token' }, { status: 400 })

    const { data, error } = await supabase
      .from('customer_support_chats')
      .select('id, session_token, role, message, created_at')
      .eq('session_token', session_token)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('supabase fetch sessions error', error)
      return NextResponse.json({ error: 'db error' }, { status: 500 })
    }

    return NextResponse.json({ messages: data || [] })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { session_token } = body
    if (!session_token) return NextResponse.json({ error: 'missing session_token' }, { status: 400 })

    // create session row if not exists (no-op here)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
