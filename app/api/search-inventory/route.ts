import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { query } = await req.json() as { query?: string }
    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Missing or invalid query' }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
    const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!SUPABASE_URL) {
      return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 })
    }

    // Prefer service role for reliable reads across RLS; fallback to anon if not set
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE || ANON || '')

    // Parallel search in products (only active) and ebooks
  const [productsRes, ebooksRes] = await Promise.all([
      supabase
        .from('products')
    .select('id, name, price, category, stock_quantity')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(10),
      supabase
        .from('ebooks')
        .select('id, title, author, price, is_free')
        .ilike('title', `%${query}%`)
        .limit(10),
    ])

    if (productsRes.error) {
      // Don't leak internals
      console.error('Products search error:', productsRes.error)
    }
    if (ebooksRes.error) {
      console.error('Ebooks search error:', ebooksRes.error)
    }

    const payload: any = {}
    if (productsRes.data && productsRes.data.length > 0) payload.products = productsRes.data
    if (ebooksRes.data && ebooksRes.data.length > 0) payload.ebooks = ebooksRes.data

    if (!payload.products && !payload.ebooks) {
      return NextResponse.json({ message: `No matches found for '${query}'.` }, { status: 200 })
    }
    return NextResponse.json(payload, { status: 200 })
  } catch (e) {
    console.error('search-inventory route error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
