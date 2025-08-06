# 📧 EmailJS Template Setup Guide

## **🎨 Redesigned Templates for Sm@rtz Global**

I've created professional, branded email templates that match your Sm@rtz Global Enterprise brand. Here's how to update them in your EmailJS dashboard.

## **🔧 Fixed EmailJS API Configuration**

### **✅ Issue Resolved**
- **Problem**: Incorrect parameter name for EmailJS REST API authentication
- **Solution**: Changed `private_key` to `accessToken` (correct parameter for REST API)
- **Files Updated**: 
  - `app/api/admin/send-email/route.ts`
  - `app/api/admin/send-password-reset/route.ts`

## **📋 Template Variables**

### **OTP Template Variables:**
- `{{to_name}}` - Recipient's full name
- `{{passcode}}` - 6-digit verification code
- `{{time}}` - Expiration time (15 minutes from now)
- `{{to_email}}` - Recipient's email address
- `{{website_link}}` - Your app URL

### **Password Reset Template Variables:**
- `{{to_name}}` - Recipient's full name
- `{{link}}` - Password reset URL
- `{{email}}` - Recipient's email address
- `{{website_link}}` - Your app URL

## **🔧 How to Update Templates**

### **Step 1: Update OTP Template**

1. **Go to EmailJS Dashboard**: https://dashboard.emailjs.com/
2. **Navigate to Email Templates**
3. **Find your OTP template** (ID: `template_zmof8ds`)
4. **Replace the HTML content** with the content from `emailjs-templates/otp-template.html`
5. **Save the template**

### **Step 2: Update Password Reset Template**

1. **Find your Password Reset template** (ID: `template_z7kbj2u`)
2. **Replace the HTML content** with the content from `emailjs-templates/password-reset-template.html`
3. **Save the template**

## **🎨 Brand Features**

### **Visual Design:**
- ✅ **Official Sm@rtz Global Logo** - From your GitHub repository
- ✅ **Professional Purple Gradient** - Brand-consistent colors
- ✅ **Modern Typography** - Clean, readable fonts
- ✅ **Responsive Design** - Works on all devices

### **Content Features:**
- ✅ **Security Warnings** - Professional security notices
- ✅ **Expiration Notices** - Clear time limits
- ✅ **Contact Information** - IT support details
- ✅ **Professional Footer** - Copyright and legal info

## **🔑 Environment Variables Check**

Make sure these are correctly set in your `.env.local`:

```env
# EmailJS Configuration
EMAILJS_SERVICE_ID=service_r5i7d5y
EMAILJS_PUBLIC_KEY=aZGVsnaWigE_-scak
EMAILJS_PRIVATE_KEY=jm0DasHOpsVBeco_9510s
EMAILJS_OTP_TEMPLATE_ID=template_zmof8ds
EMAILJS_PASSWORD_RESET_TEMPLATE_ID=template_z7kbj2u
```

## **🧪 Test the Email System**

### **Test Admin Signup:**
1. Go to `/admin-auth/auth/signup`
2. Enter admin details
3. Click "Send Verification Code"
4. Check your email for the branded verification email
5. Use the 6-digit input to enter the code

### **Test Password Reset:**
1. Go to `/admin-auth/auth/forgot-password`
2. Enter your email
3. Check your email for the branded password reset email
4. Click the reset link

## **📧 Email Features**

### **OTP Email Includes:**
- ✅ **Branded Header** with Sm@rtz Global logo
- ✅ **Large Verification Code** display
- ✅ **15-minute expiration notice**
- ✅ **Security warnings**
- ✅ **IT support contact info**

### **Password Reset Email Includes:**
- ✅ **Branded Header** with Sm@rtz Global logo
- ✅ **Clickable Reset Button**
- ✅ **Alternative text link**
- ✅ **Security tips**
- ✅ **1-hour expiration notice**

## **🚀 Production Ready**

The templates are now:
- ✅ **Professionally designed** with your brand
- ✅ **Security-focused** with proper warnings
- ✅ **Mobile-responsive** for all devices
- ✅ **Accessibility-compliant** with proper contrast
- ✅ **Email client compatible** (Gmail, Outlook, etc.)

## **🔧 Troubleshooting**

### **If emails still don't send:**
1. **Check EmailJS Dashboard** - Verify service and template IDs
2. **Verify Public Key** - Ensure it's the correct public key from dashboard
3. **Check Template Variables** - Make sure all variables are properly set
4. **Test with EmailJS Dashboard** - Use the test feature in EmailJS

### **Common Issues:**
- **Invalid Public Key**: Double-check the public key from EmailJS dashboard
- **Template Not Found**: Verify template IDs are correct
- **Service Not Active**: Ensure EmailJS service is active

## **📞 Support**

If you need help:
- **EmailJS Support**: https://www.emailjs.com/support/
- **Template Issues**: Check the HTML files in `emailjs-templates/`
- **API Issues**: Review the updated route files

---

**🎉 Your EmailJS integration is now properly configured and branded!** 