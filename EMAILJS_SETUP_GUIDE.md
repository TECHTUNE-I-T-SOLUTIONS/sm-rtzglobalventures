# EmailJS Setup Guide

## Overview
This guide will help you set up EmailJS to enable email sending functionality in the Sm@rtz Global Enterprise application.

## Current Status
✅ **Admin Email Verification Removed**: The admin signup process no longer requires email verification  
✅ **EmailJS Error Fixed**: The application now handles missing EmailJS configuration gracefully  
✅ **Fallback Mode**: Works perfectly for development without EmailJS configuration  

## EmailJS Configuration (Optional)

### For User Email Features (Password Reset, etc.)

If you want to enable email functionality for user features like password reset, follow these steps:

1. **Sign up for EmailJS**
   - Go to https://www.emailjs.com/
   - Create a free account
   - Verify your email address

2. **Create an Email Service**
   - In your EmailJS dashboard, go to "Email Services"
   - Click "Add New Service"
   - Choose your email provider (Gmail, Outlook, etc.)
   - Follow the setup instructions
   - Note down your **Service ID**

3. **Create Email Templates**
   - Go to "Email Templates"
   - Click "Create New Template"
   - Create templates for password reset, welcome emails, etc.

4. **Get Your API Keys**
   - Go to "Account" → "API Keys"
   - Copy your **Public Key** and **Private Key**

5. **Update Environment Variables**
   - Open your `.env.local` file (or create one)
   - Add these variables with your actual values:

```env
EMAILJS_SERVICE_ID=your_service_id_here
EMAILJS_PUBLIC_KEY=your_public_key_here
EMAILJS_PRIVATE_KEY=your_private_key_here
EMAILJS_OTP_TEMPLATE_ID=your_template_id_here
```

6. **Restart Your Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Current Application Status

### Admin Authentication
- ✅ **Direct Signup**: Admin accounts can be created directly without email verification
- ✅ **Simplified Process**: Single-step signup with profile picture upload
- ✅ **No Email Dependencies**: Works without any email service configuration

### User Features
- ✅ **Password Reset**: Available with EmailJS configuration
- ✅ **Welcome Emails**: Available with EmailJS configuration
- ✅ **Fallback Mode**: Works without EmailJS for development

## Database Cleanup

If you had the admin verification system previously installed, run this SQL script to clean up:

```sql
-- Run the script: scripts/remove-admin-verification.sql
```

This will remove:
- `admin_verifications` table
- All related functions and triggers
- Indexes and constraints

## Testing

### Admin Signup (No Email Required)
1. Go to `/admin-auth/auth/signup`
2. Fill in the form (name, email, password)
3. Optionally upload a profile picture
4. Click "Create Admin Account"
5. Account is created immediately

### User Features (With EmailJS)
1. Configure EmailJS as described above
2. Test password reset functionality
3. Check email delivery

### Development Mode (No EmailJS)
1. Leave EmailJS environment variables unset
2. All email features will log to console
3. Perfect for development and testing

## Troubleshooting

### Common Issues:

1. **"EmailJS failed: API calls in strict mode, but no private key was passed"**
   - Solution: Either configure EmailJS properly or use fallback mode

2. **Admin signup not working**
   - Check that the `profiles` table exists
   - Verify Supabase authentication is configured

3. **User email features not working**
   - Check EmailJS configuration
   - Verify environment variables are set correctly

## Production Considerations

For production deployment:

1. **Admin Access**: Consider implementing additional security measures for admin accounts
2. **Email Service**: Use a proper email service like SendGrid, AWS SES, or Resend
3. **Email Templates**: Set up professional email templates with your branding
4. **Email Tracking**: Add email tracking and analytics
5. **Email Queues**: Set up email queues for better performance

## Current Status

✅ **Fixed**: EmailJS configuration error  
✅ **Removed**: Admin email verification requirement  
✅ **Added**: Fallback mode for development  
✅ **Added**: Proper error handling  
✅ **Added**: Environment variable documentation  
✅ **Simplified**: Admin signup process  

The application now works seamlessly in both modes:
- **Development**: Uses fallback mode (logs to console)
- **Production**: Uses EmailJS when properly configured
- **Admin**: Direct signup without email verification 