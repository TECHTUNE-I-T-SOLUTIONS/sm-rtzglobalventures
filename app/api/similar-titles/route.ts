import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { query, limit = 6 } = await req.json() as { query?: string, limit?: number }
    if (!query || typeof query !== 'string') return NextResponse.json({ error: 'Missing query' }, { status: 400 })

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
    const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!SUPABASE_URL) return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 })
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE || ANON || '')

    // Fuzzy search across ebooks title/author and products (books category)
    const [ebooksRes, booksRes] = await Promise.all([
      supabase
        .from('ebooks')
        .select('id, title, author, price, is_free')
        .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
        .limit(limit),
      supabase
        .from('products')
        .select('id, name, price, category, stock_quantity')
        .eq('category', 'books')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(limit),
    ])

    const payload: any = {}
    if (ebooksRes.data?.length) payload.ebooks = ebooksRes.data
    if (booksRes.data?.length) payload.products = booksRes.data

    return NextResponse.json(payload, { status: 200 })
  } catch (e) {
    console.error('similar-titles route error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
