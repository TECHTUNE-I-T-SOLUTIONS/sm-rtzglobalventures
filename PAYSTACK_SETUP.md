# Paystack Integration Setup Guide

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_8f84ee268227963a668757c75978eb1ead020638
PAYSTACK_SECRET_KEY=sk_test_9f489e5d97b655208894577327f5f6229570c07c

# Paystack URLs (Update these with your actual domain)
NEXT_PUBLIC_PAYSTACK_CALLBACK_URL=http://localhost:3000/api/paystack/callback
PAYSTACK_WEBHOOK_URL=https://your-domain.com/api/paystack/webhook

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Paystack Dashboard Configuration

### 1. Callback URL
Add this URL to your Paystack dashboard:
```
http://localhost:3000/api/paystack/callback
```

### 2. Webhook URL
Add this URL to your Paystack dashboard:
```
https://your-domain.com/api/paystack/webhook
```

**Note:** Replace `your-domain.com` with your actual domain when deploying to production.

## Features Implemented

### ✅ Payment Flow
1. **Order Creation** - Creates order in database
2. **Payment Initialization** - Initializes Paystack payment
3. **Payment Processing** - Redirects to Paystack payment page
4. **Payment Verification** - Verifies payment via callback
5. **Order Updates** - Updates order status based on payment result

### ✅ Database Integration
- **Orders Table** - Stores order details with payment reference
- **Transactions Table** - Records payment transactions
- **Order Items Table** - Links products to orders
- **Automatic Stock Updates** - Reduces product stock when orders are placed

### ✅ Notification System
- **Cart Notifications** - Notifies when items are added/removed from cart
- **Order Notifications** - Notifies when orders are placed/updated
- **Payment Notifications** - Notifies when payments are processed

### ✅ Success/Failure Pages
- **Success Page** - Shows order details after successful payment
- **Failure Page** - Shows error details and troubleshooting tips

## Testing

### Test Cards
Use these test cards for testing:

**Successful Payment:**
- Card Number: `4084 0840 8408 4081`
- Expiry: Any future date
- CVV: Any 3 digits
- PIN: Any 4 digits

**Failed Payment:**
- Card Number: `4084 0840 8408 4082`
- Expiry: Any future date
- CVV: Any 3 digits
- PIN: Any 4 digits

## Production Deployment

When deploying to production:

1. **Update Environment Variables:**
   - Change to live Paystack keys
   - Update callback and webhook URLs to your production domain

2. **Update Paystack Dashboard:**
   - Add production callback URL
   - Add production webhook URL
   - Switch to live mode

3. **SSL Certificate:**
   - Ensure your domain has SSL certificate
   - Paystack requires HTTPS for production

## Security Features

- **Webhook Signature Verification** - Verifies webhook authenticity
- **Payment Reference Validation** - Ensures payment references match
- **Database Transaction Safety** - Uses database transactions for data integrity
- **Error Handling** - Comprehensive error handling and logging

## Support

For issues with Paystack integration:
1. Check Paystack dashboard for transaction logs
2. Verify webhook and callback URLs are correct
3. Ensure environment variables are properly set
4. Check browser console for any JavaScript errors 