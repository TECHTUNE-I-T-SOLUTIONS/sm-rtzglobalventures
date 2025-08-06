import { NextRequest, NextResponse } from 'next/server'
import { verifyPaystackPayment } from '@/lib/paystack'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json(
        { error: 'Missing reference' },
        { status: 400 }
      )
    }

    const paymentData = await verifyPaystackPayment(reference)

    if (paymentData.status === 'success') {
      const serviceId = paymentData.metadata?.service_id

      if (!serviceId) {
        return NextResponse.json(
          { error: 'Service ID not found in payment metadata' },
          { status: 400 }
        )
      }

      // Update business_services table
      const { error: serviceError } = await supabase
        .from('business_services')
        .update({ payment_status: 'paid' })
        .eq('id', serviceId)

      if (serviceError) {
        console.error('Error updating business service:', serviceError)
        // Continue to update transaction, but log the error
      }

      // Update transactions table
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ status: 'success', metadata: paymentData })
        .eq('payment_reference', reference)

      if (transactionError) {
        console.error('Error updating transaction:', transactionError)
        // The payment was successful, but the DB update failed.
        // This should be handled by a reconciliation process.
      }

      return NextResponse.json({ success: true, message: 'Payment verified successfully' })
    } else {
      // Update transaction to failed
      await supabase
        .from('transactions')
        .update({ status: 'failed', metadata: paymentData })
        .eq('payment_reference', reference)

      return NextResponse.json({ success: false, message: 'Payment verification failed' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Paystack service callback error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
