import { NextRequest, NextResponse } from 'next/server'
import { initializePaystackPayment, generateReference } from '@/lib/paystack'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, amount, orderId, metadata } = await request.json()

    if (!email || !amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const reference = generateReference()
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/paystack/callback`

    // Initialize Paystack payment
    const paymentData = await initializePaystackPayment({
      email,
      amount,
      reference,
      callback_url: callbackUrl,
      metadata: {
        order_id: orderId,
        ...metadata
      }
    })

    // Update order with payment reference
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        payment_reference: reference,
        payment_provider: 'paystack'
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
    }

    return NextResponse.json({
      success: true,
      data: paymentData
    })

  } catch (error: any) {
    console.error('Paystack initialization error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    )
  }
} 