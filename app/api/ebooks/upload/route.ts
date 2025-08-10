import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file provided.' });
  }

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const filePath = `public/${fileName}`;

  try {
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('ebook_files')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ success: false, error: uploadError.message });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('ebook_files').getPublicUrl(filePath);

    return NextResponse.json({ success: true, link: publicUrlData.publicUrl });
  } catch (error: any) {
    console.error('Unexpected error during upload:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unexpected error occurred.' });
  }
}
