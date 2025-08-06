import { NextRequest, NextResponse } from 'next/server'
import { verifyPaystackPayment } from '@/lib/paystack'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')
    const trxref = searchParams.get('trxref')

    if (!reference || !trxref) {
      return NextResponse.json(
        { error: 'Missing reference or trxref' },
        { status: 400 }
      )
    }

    // Verify the payment with Paystack
    const paymentData = await verifyPaystackPayment(reference)

    if (paymentData.status === 'success') {
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          status: 'processing'
        })
        .eq('payment_reference', reference)

      if (orderError) {
        console.error('Error updating order:', orderError)
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: paymentData.metadata?.user_id,
          order_id: paymentData.metadata?.order_id,
          amount: paymentData.amount / 100, // Convert from kobo to naira
          currency: 'NGN',
          payment_provider: 'paystack',
          payment_reference: reference,
          status: 'success',
          metadata: paymentData
        })

      if (transactionError) {
        console.error('Error creating transaction:', transactionError)
      }

      // Redirect to success page
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?reference=${reference}`
      )
    } else {
      // Payment failed
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'failed'
        })
        .eq('payment_reference', reference)

      if (orderError) {
        console.error('Error updating order:', orderError)
      }

      // Redirect to failure page
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/failed?reference=${reference}`
      )
    }

  } catch (error: any) {
    console.error('Paystack callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/failed?error=${encodeURIComponent(error.message)}`
    )
  }
}