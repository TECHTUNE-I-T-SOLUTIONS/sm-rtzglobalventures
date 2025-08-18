import type { NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return { ok: false, status: 401, message: 'missing authorization header' }
  const parts = authHeader.split(' ')
  if (parts.length !== 2) return { ok: false, status: 401, message: 'invalid authorization header' }
  const token = parts[1]
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token as string)
    if (error || !data?.user) return { ok: false, status: 401, message: 'invalid token' }
    const userId = data.user.id
    const { data: profiles, error: pErr } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).limit(1)
    if (pErr) return { ok: false, status: 500, message: 'failed to fetch profile' }
    const role = profiles?.[0]?.role || null
    if (role !== 'admin') return { ok: false, status: 403, message: 'admin required' }
    return { ok: true, userId }
  } catch (e) {
    return { ok: false, status: 500, message: String(e) }
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status })

  const { data, error } = await supabaseAdmin.from('push_messages').select('id,title,message,payload,sent_at,status').order('sent_at', { ascending: false }).limit(100)
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    console.error('push history error', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
