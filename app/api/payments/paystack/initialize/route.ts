import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, email, fullName, phone } = await request.json()

    if (!orderId || !amount || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      return NextResponse.json({ error: "Payment configuration error" }, { status: 500 })
    }

    const reference = `smartz_${orderId}_${Date.now()}`
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paystack/callback`

    const paymentData = {
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      reference,
      callback_url: callbackUrl,
      metadata: {
        order_id: orderId,
        full_name: fullName,
        phone,
      },
      channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Paystack initialization error:", result)
      return NextResponse.json({ error: result.message || "Payment initialization failed" }, { status: 400 })
    }

    return NextResponse.json({
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
    })
  } catch (error) {
    console.error("Payment initialization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
