-- Update Supabase Email Templates for Professional Admin Verification
-- This script updates the email templates in Supabase for better admin verification emails

-- Note: These templates need to be manually updated in the Supabase Dashboard
-- Go to Authentication > Email Templates and update the following:

-- 1. CONFIRM_SIGNUP Template (for admin verification)
/*
Subject: Sm@rtz Global Admin Verification - {{ .Token }}

<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Verification</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 8px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            overflow: hidden; 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .logo { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px; 
        }
        .subtitle { 
            font-size: 14px; 
            opacity: 0.9; 
        }
        .content { 
            padding: 40px 30px; 
        }
        .verification-box { 
            background-color: #f1f5f9; 
            border: 2px solid #e2e8f0; 
            border-radius: 8px; 
            padding: 20px; 
            text-align: center; 
            margin: 20px 0; 
        }
        .code { 
            font-size: 32px; 
            font-weight: bold; 
            color: #1e293b; 
            letter-spacing: 4px; 
            font-family: 'Courier New', monospace; 
            background-color: #ffffff; 
            padding: 15px; 
            border-radius: 6px; 
            border: 1px solid #d1d5db; 
            display: inline-block; 
            min-width: 200px; 
        }
        .instructions { 
            color: #64748b; 
            line-height: 1.6; 
            margin: 20px 0; 
        }
        .warning { 
            background-color: #fef3c7; 
            border: 1px solid #f59e0b; 
            border-radius: 6px; 
            padding: 15px; 
            margin: 20px 0; 
            color: #92400e; 
        }
        .footer { 
            background-color: #f8fafc; 
            padding: 20px 30px; 
            text-align: center; 
            color: #64748b; 
            font-size: 12px; 
        }
        .button { 
            display: inline-block; 
            background-color: #667eea; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 500; 
            margin: 10px 0; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Sm@rtz Global</div>
            <div class="subtitle">Ventures Admin Verification</div>
        </div>
        
        <div class="content">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Admin Account Verification</h2>
            
            <p class="instructions">
                Thank you for registering as an administrator for Sm@rtz Global Ventures. 
                To complete your admin account setup, please use the verification code below:
            </p>
            
            <div class="verification-box">
                <p style="margin-bottom: 15px; color: #64748b; font-size: 14px;">
                    Your verification code:
                </p>
                <div class="code">{{ .Token }}</div>
                <p style="margin-top: 15px; color: #64748b; font-size: 12px;">
                    This code will expire in 24 hours
                </p>
            </div>
            
            <div class="warning">
                <strong>Security Notice:</strong> This verification is for administrative access only. 
                If you did not request this verification, please ignore this email and contact our IT support immediately.
            </div>
            
            <p class="instructions">
                Enter this code in the admin registration form to complete your account setup. 
                After verification, you'll be able to create your admin password and access the admin dashboard.
            </p>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                If you have any questions, please contact our IT support at 
                <a href="mailto:it@smartzglobal.com" style="color: #667eea;">it@smartzglobal.com</a>
            </p>
        </div>
        
        <div class="footer">
            <p>© {{ now.Year }} Sm@rtz Global Ventures. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
*/

-- 2. MAGIC_LINK Template (for password reset)
/*
Subject: Sm@rtz Global Admin Password Reset

<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Password Reset</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 8px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            overflow: hidden; 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .logo { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px; 
        }
        .subtitle { 
            font-size: 14px; 
            opacity: 0.9; 
        }
        .content { 
            padding: 40px 30px; 
        }
        .button { 
            display: inline-block; 
            background-color: #667eea; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 500; 
            margin: 20px 0; 
            font-size: 16px; 
        }
        .instructions { 
            color: #64748b; 
            line-height: 1.6; 
            margin: 20px 0; 
        }
        .warning { 
            background-color: #fef3c7; 
            border: 1px solid #f59e0b; 
            border-radius: 6px; 
            padding: 15px; 
            margin: 20px 0; 
            color: #92400e; 
        }
        .footer { 
            background-color: #f8fafc; 
            padding: 20px 30px; 
            text-align: center; 
            color: #64748b; 
            font-size: 12px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Sm@rtz Global</div>
            <div class="subtitle">Ventures Admin Portal</div>
        </div>
        
        <div class="content">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Admin Password Reset</h2>
            
            <p class="instructions">
                You have requested to reset your admin password for Sm@rtz Global Ventures. 
                Click the button below to proceed with the password reset:
            </p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">
                    Reset Admin Password
                </a>
            </div>
            
            <div class="warning">
                <strong>Security Notice:</strong> This link is valid for 24 hours and can only be used once. 
                If you did not request this password reset, please ignore this email and contact our IT support immediately.
            </div>
            
            <p class="instructions">
                If the button doesn't work, you can copy and paste this link into your browser:
                <br>
                <a href="{{ .ConfirmationURL }}" style="color: #667eea; word-break: break-all;">
                    {{ .ConfirmationURL }}
                </a>
            </p>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                For security assistance, contact our IT support at 
                <a href="mailto:it@smartzglobal.com" style="color: #667eea;">it@smartzglobal.com</a>
            </p>
        </div>
        
        <div class="footer">
            <p>© 2024 Sm@rtz Global Ventures. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
*/

-- Instructions for manual setup:
-- 1. Go to Supabase Dashboard > Authentication > Email Templates
-- 2. Update the CONFIRM_SIGNUP template with the HTML above
-- 3. Update the MAGIC_LINK template with the HTML above
-- 4. Save the templates

-- Note: The templates use {{ .Token }} and {{ .ConfirmationURL }} which are Supabase template variables 