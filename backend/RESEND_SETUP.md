# Resend Email Setup Guide

## Current Status
✅ Resend API key configured  
⏳ Waiting for `ku-connect.co.th` domain verification  
🔄 Using temporary `onboarding@resend.dev` (can only send to kristawan.j@ku.th)

## Steps After Domain Verification

### 1. Verify Domain is Active
Check at https://resend.com/domains that `ku-connect.co.th` shows as **Verified** ✅

### 2. Update .env File
Once verified, change the `SMTP_FROM` in your `.env` file:

**Before (current - test mode):**
```env
SMTP_FROM="KU-Connect <onboarding@resend.dev>"
```

**After (production - once verified):**
```env
SMTP_FROM="KU-Connect <noreply@ku-connect.co.th>"
```

Or use any email address with your verified domain:
```env
SMTP_FROM="KU-Connect Notifications <notifications@ku-connect.co.th>"
```

### 3. Restart Your Server
```powershell
# Stop the current server (Ctrl+C in terminal)
# Then restart:
npm start
```

### 4. Test It Works
Run the test script with any email address:
```powershell
node test-resend.js any-email@example.com
```

If verified, this should now work for ANY email address, not just kristawan.j@ku.th!

## Current Limitations (Until Domain is Verified)
❌ Can only send to: `kristawan.j@ku.th` (your Resend account email)  
❌ Cannot send to other students/employers in the system  
✅ Good for: Testing the notification system with your own account

## After Verification - What You Can Do
✅ Send to ANY email address  
✅ Use custom "from" address with your domain  
✅ Send real notifications to students and employers  
✅ 3,000 emails/month on free tier  

## Troubleshooting

### If emails still don't send after verification:
1. Check domain is actually verified in Resend dashboard
2. Ensure `SMTP_FROM` uses your verified domain (`@ku-connect.co.th`)
3. Restart the backend server
4. Check server logs for any error messages

### If you see "domain not verified" error:
- DNS records may take time to propagate (usually 15 mins - 1 hour)
- Verify all DNS records are added correctly
- Try running `node test-resend.js kristawan.j@ku.th` to confirm

### Check email delivery status:
Visit https://resend.com/emails to see:
- Delivery status
- Open rates
- Any bounce/spam reports

## Quick Commands

**Test email sending:**
```powershell
node test-resend.js recipient@example.com
```

**Check current config:**
```powershell
# View what's in .env
cat .env | Select-String -Pattern "RESEND|SMTP_FROM"
```

**View server logs:**
Look for these messages:
- `📧 Using Resend email service` - Resend is active
- `✅ Email sent successfully via Resend` - Email sent
- `❌ Resend API Error` - Check the error message

## Need Help?
- Resend Docs: https://resend.com/docs
- Resend Dashboard: https://resend.com/dashboard
- Domain Verification: https://resend.com/domains
