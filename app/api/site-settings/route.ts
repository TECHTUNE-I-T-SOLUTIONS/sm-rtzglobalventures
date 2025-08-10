import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { Database } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    // Fetch site settings (assuming a 'site_settings' table exists)
    const { data: siteSettings, error: siteSettingsError } = await supabase
      .from('site_settings')
      .select('*')
      .single();

    if (siteSettingsError && siteSettingsError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching site settings:', siteSettingsError);
      return NextResponse.json({ error: 'Failed to fetch site settings' }, { status: 500 });
    }

    // Fetch current user's notification settings
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      // If no user, return default notification settings
      return NextResponse.json({
        site_name: siteSettings?.site_name || 'Sm@rtz Global Enterprise',
        site_description: siteSettings?.site_description || 'Leading provider of computer accessories, books, and business services.',
        site_keywords: siteSettings?.site_keywords || 'computer accessories, bookstore, business services',
        site_email: siteSettings?.site_email || '',
        site_phone: siteSettings?.site_phone || '',
        site_address: siteSettings?.site_address || '',
        email_notifications_enabled: true,
        order_notifications_enabled: true,
        payment_notifications_enabled: true,
        dispute_notifications_enabled: true,
        marketing_emails_enabled: false,
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email_notifications_enabled, order_notifications_enabled, payment_notifications_enabled, dispute_notifications_enabled, marketing_emails_enabled')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    return NextResponse.json({
      site_name: siteSettings?.site_name || 'Sm@rtz Global Enterprise',
      site_description: siteSettings?.site_description || 'Leading provider of computer accessories, books, and business services.',
      site_keywords: siteSettings?.site_keywords || 'computer accessories, bookstore, business services',
      site_email: siteSettings?.site_email || '',
      site_phone: siteSettings?.site_phone || '',
      site_address: siteSettings?.site_address || '',
      email_notifications_enabled: profile?.email_notifications_enabled ?? true,
      order_notifications_enabled: profile?.order_notifications_enabled ?? true,
      payment_notifications_enabled: profile?.payment_notifications_enabled ?? true,
      dispute_notifications_enabled: profile?.dispute_notifications_enabled ?? true,
      marketing_emails_enabled: profile?.marketing_emails_enabled ?? false,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/site-settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin (assuming 'role' column in 'profiles' table)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Not an admin' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { 
      site_name,
      site_description,
      site_keywords,
      site_email,
      site_phone,
      site_address,
      email_notifications_enabled,
      order_notifications_enabled,
      payment_notifications_enabled,
      dispute_notifications_enabled,
      marketing_emails_enabled,
    } = body;

    // Update site settings
    const { error: upsertError } = await supabase
      .from('site_settings')
      .upsert({
        id: 1, // Assuming a single row for site settings with a fixed ID
        site_name,
        site_description,
        site_keywords,
        site_email,
        site_phone,
        site_address,
      }, { onConflict: 'id' });

    if (upsertError) {
      console.error('Error upserting site settings:', upsertError);
      return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 });
    }

    // Update user's notification settings in profiles table
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        email_notifications_enabled,
        order_notifications_enabled,
        payment_notifications_enabled,
        dispute_notifications_enabled,
        marketing_emails_enabled,
      })
      .eq('id', user.id);

    if (updateProfileError) {
      console.error('Error updating profile notification settings:', updateProfileError);
      return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Site settings and notification preferences updated successfully' });
  } catch (error) {
    console.error('Unexpected error in PUT /api/site-settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
