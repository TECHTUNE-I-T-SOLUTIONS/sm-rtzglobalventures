import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize Supabase Admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  console.log("--- PAYSTACK WEBHOOK RECEIVED ---");
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("Webhook Error: PAYSTACK_SECRET_KEY is not set.");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error("Webhook Error: Invalid signature.");
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    console.log("Webhook signature verified successfully.");

    const event = JSON.parse(body)
    console.log(`Webhook: Received event type: ${event.event}`);

    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulPayment(event.data)
        break
      case 'charge.failed':
        await handleFailedPayment(event.data)
        break
      default:
        console.log(`Webhook: Unhandled event type: ${event.event}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleSuccessfulPayment(data: any) {
  const reference = data.reference;
  console.log(`Webhook: Handling successful payment for reference: ${reference}`);

  try {
    // First, fetch the order and its items using the reference
    const { data: order, error: fetchOrderError } = await supabaseAdmin
      .from('orders')
      .select('user_id, order_items(ebook_id)')
      .eq('payment_reference', reference)
      .single();

    if (fetchOrderError) {
      console.error(`Webhook Error: Could not fetch order for ref ${reference}.`, fetchOrderError);
      return; // Stop processing if we can't get the order
    }

    // Grant ebook access if applicable
    const ebookItems = order.order_items?.filter(item => item.ebook_id) || [];
    if (ebookItems.length > 0) {
      const acquiredEbookIds = ebookItems.map(item => item.ebook_id!);
      const acquiredEbooks = acquiredEbookIds.map(id => ({ user_id: order.user_id, ebook_id: id }));
      
      console.log(`Webhook: Granting access to ${acquiredEbookIds.length} ebook(s) for user ${order.user_id}.`);
      const { error: grantError } = await supabaseAdmin.from('acquired_ebooks').upsert(acquiredEbooks, { onConflict: 'user_id, ebook_id' });
      if (grantError) {
        console.error(`Webhook Error: Failed to grant ebook access for ref ${reference}.`, grantError);
      }
    }

    // Clear the user's entire cart
    console.log(`Webhook: Clearing cart for user ${order.user_id}.`);
    const { error: clearCartError } = await supabaseAdmin.from('cart_items').delete().eq('user_id', order.user_id);
    if (clearCartError) {
      console.error(`Webhook Error: Failed to clear cart for ref ${reference}.`, clearCartError);
    }

    // Update order status to paid
    console.log(`Webhook: Updating order status to 'paid' for ref ${reference}.`);
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'paid', status: 'processing' })
      .eq('payment_reference', reference);

    if (orderError) {
      console.error(`Webhook DB Error: Failed to update order status for ref ${reference}.`, orderError);
    } else {
      console.log(`Webhook DB Success: Order status updated for ref ${reference}.`);
    }

    // Create transaction record
    console.log(`Webhook: Creating transaction record for ref ${reference}.`);
    const { error: transactionError } = await supabaseAdmin
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
      }, { onConflict: 'payment_reference' });

    if (transactionError) {
      console.error(`Webhook DB Error: Failed to create transaction for ref ${reference}.`, transactionError);
    } else {
      console.log(`Webhook DB Success: Transaction created for ref ${reference}.`);
    }

  } catch (error) {
    console.error(`Webhook Error: Unhandled exception in handleSuccessfulPayment for ref ${reference}.`, error);
  }
}

async function handleFailedPayment(data: any) {
  const reference = data.reference;
  console.log(`Webhook: Handling failed payment for reference: ${reference}`);
  try {
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('payment_reference', reference);

    if (orderError) {
      console.error(`Webhook DB Error: Failed to update order to failed for ref ${reference}.`, orderError);
    }
  } catch (error) {
    console.error(`Webhook Error: Unhandled exception in handleFailedPayment for ref ${reference}.`, error);
  }
}
