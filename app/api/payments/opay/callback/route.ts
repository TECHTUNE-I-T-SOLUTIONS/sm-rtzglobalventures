import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference, status, orderNo } = body

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    const opayPrivateKey = process.env.OPAY_PRIVATE_KEY
    if (!opayPrivateKey) {
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    // Verify signature
    const signatureString = Object.keys(body)
      .sort()
      .map((key) => `${key}=${body[key]}`)
      .join("&")

    const expectedSignature = crypto.createHmac("sha512", opayPrivateKey).update(signatureString).digest("hex")

    if (body.sign !== expectedSignature) {
      console.error("Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Extract order ID from reference
    const orderId = reference.split("_")[2]

    if (status === "SUCCESS") {
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
        return NextResponse.json({ error: "Database error" }, { status: 500 })
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

      return NextResponse.json({ message: "Payment confirmed" })
    } else {
      // Payment failed
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          status: "cancelled",
        })
        .eq("id", orderId)

      return NextResponse.json({ message: "Payment failed" })
    }
  } catch (error) {
    console.error("OPay callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
