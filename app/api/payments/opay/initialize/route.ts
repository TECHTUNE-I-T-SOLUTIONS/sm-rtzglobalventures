import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, email, fullName, phone } = await request.json()

    if (!orderId || !amount || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const opayMerchantId = process.env.OPAY_MERCHANT_ID
    const opayPublicKey = process.env.OPAY_PUBLIC_KEY
    const opayPrivateKey = process.env.OPAY_PRIVATE_KEY

    if (!opayMerchantId || !opayPublicKey || !opayPrivateKey) {
      return NextResponse.json({ error: "Payment configuration error" }, { status: 500 })
    }

    const reference = `smartz_opay_${orderId}_${Date.now()}`
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/opay/callback`
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/order-success?order=${orderId}`

    const paymentData = {
      reference,
      mchShortName: "Smartz Global",
      productName: "Order Payment",
      productDesc: `Payment for order #${orderId.slice(-8)}`,
      userPhone: phone,
      userRequestIp: "127.0.0.1",
      amount: amount * 100, // OPay expects amount in kobo
      currency: "NGN",
      payMethods: ["account", "qrcode", "bankcard", "banktransfer"],
      payTypes: ["WEB"],
      callbackUrl,
      returnUrl,
      expireAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    }

    // Create signature for OPay
    const signatureString = Object.keys(paymentData)
      .sort()
      .map((key) => `${key}=${paymentData[key as keyof typeof paymentData]}`)
      .join("&")

    const signature = crypto.createHmac("sha512", opayPrivateKey).update(signatureString).digest("hex")

    const requestBody = {
      ...paymentData,
      merchantId: opayMerchantId,
      sign: signature,
    }

    const response = await fetch("https://payapi.opayweb.com/api/v1/international/cashier/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opayPublicKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    const result = await response.json()

    if (!response.ok || result.code !== "00000") {
      console.error("OPay initialization error:", result)
      return NextResponse.json({ error: result.message || "Payment initialization failed" }, { status: 400 })
    }

    return NextResponse.json({
      authorization_url: result.data.cashierUrl,
      reference: result.data.reference,
    })
  } catch (error) {
    console.error("OPay payment initialization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
