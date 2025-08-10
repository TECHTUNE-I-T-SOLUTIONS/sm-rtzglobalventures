import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import type { Database } from '@/lib/supabase';

export async function POST(request: Request) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  try {
    const formData = await request.formData();
    const faviconFile = formData.get('favicon') as File;

    if (!faviconFile) {
      return NextResponse.json({ error: 'No favicon file provided' }, { status: 400 });
    }

    // --- Start: Delete existing favicons ---
    const { data: existingFiles, error: listError } = await supabase.storage
      .from('site_assets')
      .list('favicons/');

    if (listError) {
      console.error('Error listing existing favicons:', listError);
      // Continue without deleting if listing fails, to allow new upload
    } else if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(file => `favicons/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from('site_assets')
        .remove(filesToDelete);

      if (deleteError) {
        console.error('Error deleting old favicons:', deleteError);
        // Continue without deleting if deletion fails, to allow new upload
      }
    }
    // --- End: Delete existing favicons ---

    const fileExt = faviconFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `favicons/${fileName}`;

    const { data, error } = await supabase.storage
      .from('site_assets')
      .upload(filePath, faviconFile, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading favicon:', error);
      return NextResponse.json({ error: 'Failed to upload favicon' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('site_assets')
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    console.error('Unexpected error in POST /api/upload-favicon:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

