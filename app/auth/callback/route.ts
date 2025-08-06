import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${error}`)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Session exchange error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=session_error`)
      }

      // Create profile for OAuth users if it doesn't exist
      if (data.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single()

          if (!profile) {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
                avatar_url: data.user.user_metadata?.avatar_url,
              })

            if (profileError) {
              console.error('Profile creation error for OAuth user:', profileError)
              // Try using the function as fallback
              await supabase.rpc('create_profile_for_user', {
                user_id: data.user.id,
                user_email: data.user.email!,
                user_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
                user_avatar: data.user.user_metadata?.avatar_url
              })
            }
          }
        } catch (profileError) {
          console.error('Error handling OAuth user profile:', profileError)
          // Continue with the flow even if profile creation fails
        }
      }
    } catch (callbackError) {
      console.error('Auth callback error:', callbackError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=callback_error`)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
