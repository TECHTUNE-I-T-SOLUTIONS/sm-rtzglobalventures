// app/api/admin/users/last-sign-in/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase with the Service Role Key
// Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // Your public Supabase URL
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Your secret Supabase Service Role Key
);

export async function POST(request: Request) {
  try {
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    // Fetch users from auth.users table using the service role key
    // This bypasses RLS
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Error listing users with service role key:', error);
      return NextResponse.json({ error: 'Failed to fetch users from auth table' }, { status: 500 });
    }

    // Filter users to only include those requested and extract last_sign_in_at
    const filteredUsersData = users.users
      .filter(user => userIds.includes(user.id))
      .map(user => ({
        id: user.id,
        last_sign_in_at: user.last_sign_in_at,
      }));

    return NextResponse.json(filteredUsersData);
  } catch (error) {
    console.error('Unexpected error in API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}