# Email Service Setup Instructions

## Issues Fixed

### 1. Google OAuth Button Visibility ✅
- **Issue**: "Continue with Google" button was not showing on login page
- **Fix**: Removed the "temporarily unavailable" notice from LoginNew.jsx
- **Status**: Button is now visible and working

### 2. Email Credentials Fixed ✅
- **Issue**: Gmail App Password had spaces: `dgxs xofa uyss or`
- **Fix**: Removed spaces: `dgxsxofauyssor`
- **Status**: Updated in backend/.env file

### 3. Email Routes Added ✅
- **Issue**: Email routes were not registered in server.js
- **Fix**: Added email routes registration
- **Status**: Email API endpoints now available

---

## CRITICAL: Vercel Environment Variables

You MUST update these environment variables in your Vercel dashboard:

### Backend Project (shopix-backendd)

Go to: https://vercel.com/shafeeq-3s-projects/shopix-backendd/settings/environment-variables

**Update these variables:**

```
SMTP_EMAIL=frostedveil0@gmail.com
SMTP_PASSWORD=dgxsxofauyssor
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SUPPORT_EMAIL=frostedveil0@gmail.com
EMAIL_USER=frostedveil0@gmail.com
EMAIL_PASS=dgxsxofauyssor
```

**IMPORTANT**: Remove ALL spaces from the password! It should be: `dgxsxofauyssor`

---

## How to Update Vercel Environment Variables

### Method 1: Vercel Dashboard (Recommended)
1. Go to https://vercel.com
2. Select your project: **shopix-backendd**
3. Go to **Settings** → **Environment Variables**
4. Find each email-related variable
5. Click **Edit** and update the value
6. Click **Save**
7. **Redeploy** your project after updating all variables

### Method 2: Vercel CLI
```bash
vercel env add SMTP_PASSWORD
# Enter: dgxsxofauyssor
# Select: Production, Preview, Development

vercel env add SMTP_EMAIL
# Enter: frostedveil0@gmail.com
# Select: Production, Preview, Development
```

---

## Email Features Now Available

### 1. Order Emails
- ✅ Order Confirmation (sent automatically when order is placed)
- ✅ Order Shipped (sent when admin marks order as shipped)
- ✅ Order Delivered (sent when order is delivered)
- ✅ Order Cancelled (sent when order is cancelled)

### 2. User Emails
- ✅ Welcome Email (sent on registration)
- ✅ Profile Updated (sent when user updates profile)
- ✅ Password Changed (sent when password is changed)
- ✅ Password Reset (sent when user requests password reset)

### 3. Admin Emails
- ✅ Low Stock Alert
- ✅ Newsletter to customers
- ✅ Custom emails

---

## Testing Email Configuration

### Test Endpoint
```
POST https://shopix-backendd.vercel.app/api/emails/test-configuration
```

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ADMIN_TOKEN",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "testEmail": "your-email@gmail.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

---

## Troubleshooting

### If emails are still not sending:

1. **Check Gmail Settings**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"
   - Generate a new App Password:
     - Go to: https://myaccount.google.com/apppasswords
     - Select "Mail" and "Other (Custom name)"
     - Copy the 16-character password (NO SPACES!)
     - Update in Vercel environment variables

2. **Check Vercel Logs**
   ```bash
   vercel logs shopix-backendd --follow
   ```
   Look for email-related errors

3. **Verify Environment Variables**
   ```bash
   vercel env ls
   ```
   Make sure all email variables are set

4. **Test Locally First**
   ```bash
   cd backend
   node -e "
   require('dotenv').config();
   const nodemailer = require('nodemailer');
   const transporter = nodemailer.createTransporter({
     host: 'smtp.gmail.com',
     port: 587,
     secure: false,
     auth: {
       user: process.env.SMTP_EMAIL,
       pass: process.env.SMTP_PASSWORD
     }
   });
   transporter.sendMail({
     from: process.env.SMTP_EMAIL,
     to: 'your-email@gmail.com',
     subject: 'Test Email',
     text: 'This is a test email'
   }).then(() => console.log('Email sent!')).catch(err => console.error('Error:', err));
   "
   ```

---

## Email Templates

All emails use professional SHOPIX branding with:
- Orange to Red gradient (#FF6B35 to #EF4444)
- Responsive design
- Professional layout
- Clear call-to-action buttons

---

## Next Steps

1. ✅ Update Vercel environment variables (CRITICAL!)
2. ✅ Redeploy backend on Vercel
3. ✅ Test email configuration using the test endpoint
4. ✅ Place a test order to verify order confirmation email
5. ✅ Check spam folder if emails don't arrive

---

## Files Modified

1. `backend/.env` - Fixed SMTP password (removed spaces)
2. `backend/server.js` - Added email routes registration
3. `frontend/src/pages/LoginNew.jsx` - Removed "temporarily unavailable" notice

---

## Support

If emails still don't work after following these steps:
1. Check Vercel deployment logs
2. Verify Gmail App Password is correct (no spaces!)
3. Make sure 2-Step Verification is enabled on Gmail
4. Try generating a new App Password
5. Check if Gmail is blocking the login attempt

---

**Last Updated**: January 7, 2026
**Status**: Ready for deployment
