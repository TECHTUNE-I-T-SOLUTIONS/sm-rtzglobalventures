import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/order-failed?error=missing_reference`)
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/order-failed?error=config_error`)
    }

    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    })

    const result = await response.json()

    if (!response.ok || !result.status) {
      console.error("Payment verification failed:", result)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/order-failed?error=verification_failed`)
    }

    const { data } = result
    const orderId = data.metadata.order_id

    if (data.status === "success") {
      // Update order status in database
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processing",
          payment_reference: reference,
        })
        .eq("id", orderId)

      if (updateError) {
        console.error("Database update error:", updateError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/order-failed?error=database_error`)
      }

      // Create notification for user
      const { data: order } = await supabase.from("orders").select("user_id").eq("id", orderId).single()

      if (order) {
        await supabase.from("notifications").insert([
          {
            user_id: order.user_id,
            title: "Payment Successful",
            message: `Your payment for order #${orderId.slice(-8)} has been confirmed. Your order is now being processed.`,
            type: "success",
          },
        ])
      }

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/order-success?order=${orderId}`)
    } else {
      // Payment failed
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          status: "cancelled",
        })
        .eq("id", orderId)

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/order-failed?error=payment_failed`)
    }
  } catch (error) {
    console.error("Payment callback error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/order-failed?error=server_error`)
  }
}