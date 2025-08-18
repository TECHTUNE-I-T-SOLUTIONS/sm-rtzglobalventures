import type { NextRequest } from 'next/server'
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

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status })

    const body = await req.json()
    const { filename } = body
    if (!filename) return NextResponse.json({ ok: false, error: 'missing filename' }, { status: 400 })

    // choose path under public/push-images
    const path = `public/push-images/${Date.now()}_${filename}`

    // create signed upload url (server-side using service role)
    const { data, error } = await supabaseAdmin.storage.from('push-images').createSignedUploadUrl(path, { upsert: true }) as any
    if (error) {
      console.error('createSignedUploadUrl error', error)
      return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
    }

    // also get public url (bucket expected to be public as requested)
    const { data: pub } = await supabaseAdmin.storage.from('push-images').getPublicUrl(path)

    return NextResponse.json({ ok: true, path, signedUpload: data, publicUrl: pub?.publicUrl || null })
  } catch (e) {
    console.error('sign-url error', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
