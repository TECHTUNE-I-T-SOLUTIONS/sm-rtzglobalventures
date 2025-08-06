import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, resetLink, fullName } = await request.json()
    
    // Validate EmailJS configuration
    if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY || !process.env.EMAILJS_PASSWORD_RESET_TEMPLATE_ID) {
      console.error('EmailJS configuration missing')
      return NextResponse.json({ 
        error: "Email service not configured" 
      }, { status: 500 })
    }

    console.log('Sending password reset email to:', email)
    console.log('Using template:', process.env.EMAILJS_PASSWORD_RESET_TEMPLATE_ID)

    // EmailJS REST API call for password reset
    const requestBody = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_PASSWORD_RESET_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        to_name: fullName,
        link: resetLink,
        email: email,
        company_name: 'Sm@rtz Global Enterprise',
        website_link: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }
    }

    console.log('EmailJS password reset request body:', JSON.stringify(requestBody, null, 2))

    // Send email using EmailJS REST API
    const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!emailjsResponse.ok) {
      const errorData = await emailjsResponse.text()
      console.error('EmailJS error:', errorData)
      console.error('EmailJS status:', emailjsResponse.status)
      console.error('EmailJS statusText:', emailjsResponse.statusText)
      throw new Error(`EmailJS failed: ${errorData}`)
    }

    const result = await emailjsResponse.json()
    console.log('EmailJS result:', result)
    
    return NextResponse.json({ 
      success: true, 
      message: "Password reset email sent successfully"
    })

  } catch (error: any) {
    console.error('Send password reset email error:', error)
    return NextResponse.json({ 
      error: error.message || "Failed to send password reset email" 
    }, { status: 500 })
  }
} 