import { NextRequest, NextResponse } from 'next/server'
import { verifyPaystackPayment } from '@/lib/paystack'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)

    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulPayment(event.data)
        break
      
      case 'transfer.success':
        await handleSuccessfulTransfer(event.data)
        break
      
      case 'charge.failed':
        await handleFailedPayment(event.data)
        break
      
      default:
        console.log('Unhandled webhook event:', event.event)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleSuccessfulPayment(data: any) {
  try {
    const reference = data.reference

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

    // Create transaction record if it doesn't exist
    const { error: transactionError } = await supabase
      .from('transactions')
      .upsert({
        user_id: data.metadata?.user_id,
        order_id: data.metadata?.order_id,
        amount: data.amount / 100,
        currency: 'NGN',
        payment_provider: 'paystack',
        payment_reference: reference,
        status: 'success',
        metadata: data
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
    }

  } catch (error) {
    console.error('Error handling successful payment:', error)
  }
}

async function handleSuccessfulTransfer(data: any) {
  try {
    // Handle successful transfers (if needed)
    console.log('Successful transfer:', data)
  } catch (error) {
    console.error('Error handling successful transfer:', error)
  }
}

async function handleFailedPayment(data: any) {
  try {
    const reference = data.reference

    // Update order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'failed'
      })
      .eq('payment_reference', reference)

    if (orderError) {
      console.error('Error updating order:', orderError)
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .upsert({
        user_id: data.metadata?.user_id,
        order_id: data.metadata?.order_id,
        amount: data.amount / 100,
        currency: 'NGN',
        payment_provider: 'paystack',
        payment_reference: reference,
        status: 'failed',
        metadata: data
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
    }

  } catch (error) {
    console.error('Error handling failed payment:', error)
  }
} 