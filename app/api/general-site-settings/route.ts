import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import type { Database } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key environment variables.')
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export async function GET() {
  try {
    const { data: siteSettings, error } = (await supabase
      .from('site_settings')
      .select('site_name, site_description, site_keywords, favicon_url')
      .single()) as {
      data: {
        site_name: string
        site_description: string
        site_keywords: string
        favicon_url: string
      } | null
      error: any
    }

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found
      console.error('Error fetching general site settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch general site settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      site_name: siteSettings?.site_name || 'Sm@rtz Global V',
      site_description:
        siteSettings?.site_description ||
        'Leading provider of computer accessories, books, and business services. Shop computers, books, and get professional document services. (in beta)',
      site_keywords:
        siteSettings?.site_keywords ||
        'computer accessories, bookstore, business services, printing, Ilorin, Nigeria',
      favicon_url: siteSettings?.favicon_url || '/favicon.ico',
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/general-site-settings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
