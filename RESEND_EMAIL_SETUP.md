# Resend Email Configuration - Testing vs Production

## Current Issue

Your Resend account is in **testing/sandbox mode**. In this mode, emails can **only be sent to your verified email address (medalihi@gmail.com)**.

### Error Message Explained
```
You can only send testing emails to your own email address (medalihi@gmail.com). 
To send emails to other recipients, please verify a domain at resend.com/domains, 
and change the `from` address to an email using this domain.
```

This is why password reset emails aren't reaching other users - Resend is blocking them.

---

## Solutions

### ✅ Solution 1: Verify a Domain (Recommended for Production)

**Steps:**
1. Go to [resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `boosterproject.com`)
4. Add the DNS records provided by Resend
5. Once verified, use an email from that domain as the sender:
   - Update `RESEND_SENDER_EMAIL` in `.env.local`:
     ```
     RESEND_SENDER_EMAIL=noreply@boosterproject.com
     ```

**After verification:** You can send emails to ANY recipient from emails on your verified domain.

---

### ✅ Solution 2: Add Verified Recipients (For Testing)

If you want to keep testing before verifying a domain:

1. Go to [resend.com/audiences](https://resend.com/audiences)
2. Click "Add Audience"
3. Enter the email addresses you want to test with (e.g., test users)
4. They'll receive a verification email
5. Once they verify, you can send emails to them

---

### ✅ Solution 3: For Development - Send to Your Email Only

For now, in development, password reset emails will only reach **medalihi@gmail.com**.

To test the full flow:
1. Create a test account with email: `medalihi@gmail.com`
2. Request password reset with that email
3. Check your Gmail inbox for the reset link
4. Verify it works

---

## Current Configuration

Your `.env.local` has been updated with:
```
RESEND_SENDER_EMAIL=onboarding@resend.dev
```

The email service will use this sender address for all emails.

---

## Next Steps

**Recommended for Production:**
1. Verify your domain with Resend (domains page)
2. Update `RESEND_SENDER_EMAIL` to use your domain
3. All emails will then work for all users

**For Immediate Testing:**
1. Use test account with `medalihi@gmail.com` email
2. Send password reset to that address
3. Verify you receive the email and can reset password

---

## API Limits (Current Free Tier)

From the Resend response headers:
- **Daily quota:** 0 (free tier)
- **Monthly quota:** 6 emails
- **Rate limit:** 5 requests per second

If you need to send more emails, you may need to upgrade your Resend plan.
