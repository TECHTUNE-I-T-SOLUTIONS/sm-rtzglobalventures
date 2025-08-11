import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
    const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!SUPABASE_URL) return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 })
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE || ANON || '')

    // New arrivals: most recent ebooks and products
    const [newEbooks, newProducts] = await Promise.all([
      supabase
        .from('ebooks')
        .select('id, title, author, price, is_free, created_at')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('products')
        .select('id, name, price, category, stock_quantity, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6),
    ])

    const payload: any = {}
    if (newEbooks.data?.length) payload.newEbooks = newEbooks.data
    if (newProducts.data?.length) payload.newProducts = newProducts.data

    return NextResponse.json(payload, { status: 200 })
  } catch (e) {
    console.error('recommendations route error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
