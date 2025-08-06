import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password, fullName, securityQuestions } = await request.json()
    
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile record and security questions if user was created
    if (authData.user) {
      try {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            full_name: fullName,
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        // Create security questions if provided
        if (securityQuestions && authData.user.id) {
          const { error: securityError } = await supabase
            .from('security_questions')
            .insert({
              user_id: authData.user.id,
              question_1: securityQuestions.question1,
              answer_1: securityQuestions.answer1,
              question_2: securityQuestions.question2,
              answer_2: securityQuestions.answer2,
            })

          if (securityError) {
            console.error('Security questions creation error:', securityError)
          }
        }
      } catch (dbError) {
        console.error('Database operation error:', dbError)
        // Continue with signup even if database operations fail
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Account created successfully! Please check your email to verify your account." 
    })

  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json({ 
      error: error.message || "Signup failed" 
    }, { status: 500 })
  }
} 