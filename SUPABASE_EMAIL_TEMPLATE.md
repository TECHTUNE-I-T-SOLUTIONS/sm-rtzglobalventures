# Supabase Email Template for Admin Confirmation

## Subject Line
```
Sm@rtz Global Admin Account Confirmation
```

## HTML Template
```html
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Account Confirmation</title>
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
        .button:hover { 
            background-color: #5a67d8; 
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
        .highlight { 
            background-color: #f1f5f9; 
            border: 2px solid #e2e8f0; 
            border-radius: 8px; 
            padding: 20px; 
            text-align: center; 
            margin: 20px 0; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Sm@rtz Global</div>
            <div class="subtitle">Enterprise Admin Setup</div>
        </div>
        
        <div class="content">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Welcome to Sm@rtz Global Enterprise!</h2>
            
            <p class="instructions">
                Thank you for registering as an administrator for Sm@rtz Global Enterprise. 
                To complete your admin account setup, please confirm your email address by clicking the button below:
            </p>
            
            <div class="highlight">
                <p style="margin-bottom: 15px; color: #64748b; font-size: 14px;">
                    Click the button below to confirm your admin account:
                </p>
                <a href="{{ .ConfirmationURL }}" class="button">
                    Confirm Admin Account
                </a>
                <p style="margin-top: 15px; color: #64748b; font-size: 12px;">
                    This link will expire in 24 hours
                </p>
            </div>
            
            <div class="warning">
                <strong>Security Notice:</strong> This confirmation is for administrative access only. 
                If you did not request this admin account, please ignore this email and contact our IT support immediately.
            </div>
            
            <p class="instructions">
                After confirming your email, you'll be able to log in to the admin dashboard and manage the Sm@rtz Global Enterprise platform.
            </p>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                If you have any questions, please contact our IT support at 
                <a href="mailto:printatsmartz@gmail.com" style="color: #667eea;">printatsmartz@gmail.com</a>
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 Sm@rtz Global Enterprise. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
```

## How to Update in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Select **Confirm signup** template
4. Update the **Subject** and **HTML content** with the above template
5. Save the changes

## Template Variables

- `{{ .ConfirmationURL }}` - The confirmation link that Supabase generates
- `{{ .Token }}` - The confirmation token (not used in this template)
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - The user's email address 