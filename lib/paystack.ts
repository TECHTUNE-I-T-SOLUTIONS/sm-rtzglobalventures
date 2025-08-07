// Paystack Configuration
export const PAYSTACK_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
  secretKey: process.env.PAYSTACK_SECRET_KEY!,
  baseUrl: 'https://api.paystack.co',
  callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback`,
  webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/webhook`
}

// Paystack API functions
export async function initializePaystackPayment(data: {
  email: string
  amount: number
  reference: string
  callback_url: string
  metadata?: any
}) {
  try {
    const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        amount: data.amount * 100, // Paystack expects amount in kobo (smallest currency unit)
        reference: data.reference,
        callback_url: data.callback_url,
        metadata: data.metadata || {},
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        currency: 'NGN'
      }),
    })

    const result = await response.json()
    
    if (!result.status) {
      throw new Error(result.message || 'Failed to initialize payment')
    }

    return result.data
  } catch (error) {
    console.error('Paystack initialization error:', error)
    throw error
  }
}

export async function verifyPaystackPayment(reference: string) {
  try {
    const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.secretKey}`,
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    
    if (!result.status) {
      throw new Error(result.message || 'Failed to verify payment')
    }

    return result.data
  } catch (error) {
    console.error('Paystack verification error:', error)
    throw error
  }
}

export async function createPaystackTransfer(data: {
  recipient: string
  amount: number
  reference: string
  reason?: string
}) {
  try {
    const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/transfer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: data.recipient,
        amount: data.amount * 100, // Paystack expects amount in kobo
        reference: data.reference,
        reason: data.reason || 'Payment for order',
        currency: 'NGN'
      }),
    })

    const result = await response.json()
    
    if (!result.status) {
      throw new Error(result.message || 'Failed to create transfer')
    }

    return result.data
  } catch (error) {
    console.error('Paystack transfer error:', error)
    throw error
  }
}

// Generate unique reference
export function generateReference(): string {
  return `SMARTZ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
} 