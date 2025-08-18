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

    // list files under public/push-images (or root) and return public urls
    const prefixes = ['public/push-images', 'push-images', '']
    let files: any[] = []
    for (const p of prefixes) {
      try {
        const { data, error } = await supabaseAdmin.storage.from('push-images').list(p, { limit: 500 })
        if (!error && data && data.length) { files = data; break }
      } catch (e) {}
    }

    // return signed URLs (1 hour) for each file so images load regardless of bucket public setting
    const items = await Promise.all((files || []).map(async (f:any) => {
      const path = `public/push-images/${f.name}`
      let url = ''
      try {
        // create a signed url valid for 1 hour
        const { data: signed } = await supabaseAdmin.storage.from('push-images').createSignedUrl(path, 60 * 60) as any
        if (signed?.signedUrl) url = signed.signedUrl
      } catch (e) {
        // fallback to public url
        try {
          const { data: ud } = await supabaseAdmin.storage.from('push-images').getPublicUrl(path)
          if (ud?.publicUrl) url = ud.publicUrl
        } catch (er) {}
      }
      return { name: f.name, path, url }
    }))

    return NextResponse.json({ ok: true, data: items.filter(i=>i.url) })
  } catch (e) {
    console.error('push images list error', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
