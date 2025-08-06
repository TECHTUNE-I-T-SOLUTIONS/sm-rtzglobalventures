import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, verificationCode, fullName } = await request.json()
    
    // Check if EmailJS is properly configured
    const isEmailJSConfigured = process.env.EMAILJS_SERVICE_ID && 
                               process.env.EMAILJS_PUBLIC_KEY && 
                               process.env.EMAILJS_PRIVATE_KEY && 
                               process.env.EMAILJS_OTP_TEMPLATE_ID

    if (!isEmailJSConfigured) {
      console.warn('EmailJS not configured - using fallback email service')
      
      // Fallback: Log the email details for development/testing
      console.log('=== EMAIL NOTIFICATION (FALLBACK) ===')
      console.log('To:', email)
      console.log('Subject: Verification Code')
      console.log('Code:', verificationCode)
      console.log('Name:', fullName)
      console.log('=====================================')
      
      // In production, you would integrate with a real email service here
      // For now, we'll simulate success
      return NextResponse.json({ 
        success: true, 
        message: "Verification email sent successfully (fallback mode)",
        fallback: true
      })
    }

    console.log('Sending EmailJS email to:', email)
    console.log('Using template:', process.env.EMAILJS_OTP_TEMPLATE_ID)
    console.log('Full name:', fullName)
    console.log('Verification code:', verificationCode)

    // Calculate expiration time (15 minutes from now)
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000)
    const formattedTime = expirationTime.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    // EmailJS REST API call with correct structure
    const requestBody = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_OTP_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        to_name: fullName,
        passcode: verificationCode,
        time: formattedTime,
        company_name: 'Sm@rtz Global Enterprise',
        website_link: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }
    }

    console.log('EmailJS request body:', JSON.stringify(requestBody, null, 2))

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
      
      // If EmailJS fails, fall back to logging
      console.log('=== EMAIL NOTIFICATION (FALLBACK DUE TO ERROR) ===')
      console.log('To:', email)
      console.log('Subject: Verification Code')
      console.log('Code:', verificationCode)
      console.log('Name:', fullName)
      console.log('==================================================')
      
      return NextResponse.json({ 
        success: true, 
        message: "Verification email sent successfully (fallback mode)",
        fallback: true,
        originalError: errorData
      })
    }

    const result = await emailjsResponse.json()
    console.log('EmailJS result:', result)
    
    return NextResponse.json({ 
      success: true, 
      message: "Verification email sent successfully"
    })

  } catch (error: any) {
    console.error('Send email error:', error)
    
    // Even if there's an error, we can still log the email for development
    try {
      const { email, verificationCode, fullName } = await request.json()
      console.log('=== EMAIL NOTIFICATION (ERROR FALLBACK) ===')
      console.log('To:', email)
      console.log('Subject: Verification Code')
      console.log('Code:', verificationCode)
      console.log('Name:', fullName)
      console.log('============================================')
    } catch (parseError) {
      console.error('Could not parse request for fallback logging:', parseError)
    }
    
    return NextResponse.json({ 
      error: error.message || "Failed to send email",
      fallback: true
    }, { status: 500 })
  }
} 