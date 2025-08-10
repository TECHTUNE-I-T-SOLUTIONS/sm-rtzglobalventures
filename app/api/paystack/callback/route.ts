import { NextRequest, NextResponse } from 'next/server'
import { verifyPaystackPayment } from '@/lib/paystack'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  
  if (!reference) {
    return NextResponse.redirect(new URL('/checkout/failed?error=missing_reference', request.url));
  }

  try {
    const paymentData = await verifyPaystackPayment(reference);

    if (paymentData.status !== 'success') {
      // Payment failed or was abandoned
      return NextResponse.redirect(new URL(`/checkout/failed?reference=${reference}`, request.url));
    }

    // --- PAYMENT IS VERIFIED AND SUCCESSFUL --- 

    let hasEbooks = false;
    let hasProducts = false;
    let acquiredEbookIds: string[] = [];
    let userId: string | null = null;

    // Process the order, grant access, and clear the cart
    try {
      const { data: order, error: fetchOrderError } = await supabaseAdmin
        .from('orders')
        .select('user_id, order_items(product_id, ebook_id)')
        .eq('payment_reference', reference)
        .single();

      if (fetchOrderError) throw fetchOrderError;

      userId = order.user_id;

      if (order.order_items && order.order_items.length > 0) {
        hasEbooks = order.order_items.some(item => !!item.ebook_id);
        hasProducts = order.order_items.some(item => !!item.product_id);
        
        if (hasEbooks) {
          acquiredEbookIds = order.order_items.filter(item => !!item.ebook_id).map(item => item.ebook_id!);
          const acquiredEbooks = acquiredEbookIds.map(id => ({ user_id: order.user_id, ebook_id: id }));
          await supabaseAdmin.from('acquired_ebooks').upsert(acquiredEbooks, { onConflict: 'user_id, ebook_id' });
        }
      }

      // Clear the entire cart for the user
      if (userId) {
        await supabaseAdmin.from('cart_items').delete().eq('user_id', userId);
      }

    } catch (error) {
      console.error('Error during post-payment processing (ebook access/cart clear):', error);
      // Don't block the user for this, but log it.
    }

    // Update order and transaction tables
    await supabaseAdmin.from('orders').update({ payment_status: 'paid', status: 'processing' }).eq('payment_reference', reference);
    await supabaseAdmin.from('transactions').insert({
      user_id: paymentData.metadata?.user_id,
      order_id: paymentData.metadata?.order_id,
      amount: paymentData.amount / 100,
      currency: 'NGN',
      payment_provider: 'paystack',
      payment_reference: reference,
      status: 'success',
      metadata: paymentData
    });

    // --- CONDITIONAL REDIRECT --- 
    let successUrl;
    if (hasEbooks && hasProducts) {
      successUrl = new URL('/checkout/mixed-success', request.url);
      successUrl.searchParams.set('ebookIds', acquiredEbookIds.join(','));
    } else if (hasEbooks) {
      successUrl = new URL('/checkout/ebook-success', request.url);
      successUrl.searchParams.set('ebookIds', acquiredEbookIds.join(','));
    } else {
      successUrl = new URL('/checkout/success', request.url);
    }
    successUrl.searchParams.set('reference', reference);

    return NextResponse.redirect(successUrl);

  } catch (error: any) {
    console.error('Critical error in Paystack callback:', error);
    const errorMessage = error.message || 'An unknown error occurred';
    return NextResponse.redirect(new URL(`/checkout/failed?error=${encodeURIComponent(errorMessage)}`, request.url));
  }
}