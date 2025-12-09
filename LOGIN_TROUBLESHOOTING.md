# Login Troubleshooting Guide

## Common Login Issues

### 1. "Invalid login credentials"
**Possible causes:**
- Wrong email or password
- Email not verified (if email confirmation is required)
- Account doesn't exist

**Solutions:**
- Double-check your email and password
- Try resetting your password
- Check if you need to verify your email first

### 2. "Email not confirmed"
**Solution:**
- Check your email inbox for verification link
- Check spam folder
- Request a new verification email from Supabase Dashboard

### 3. "User already registered"
**Solution:**
- Use the "Sign In" tab instead of "Sign Up"
- Or reset your password if you forgot it

### 4. Password Requirements
- Minimum 6 characters
- No special requirements (but use a strong password!)

## Debug Steps

### Check Browser Console
1. Open browser console (F12)
2. Try to log in
3. Look for error messages starting with `[Auth]` or `[AuthContext]`

### Check Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** → **Users**
3. Check if your user exists
4. Check if email is confirmed

### Test Login Directly
Run this in browser console:

```javascript
// Test login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'your-email@example.com',
  password: 'your-password'
});

if (error) {
  console.error('Login error:', error);
} else {
  console.log('Login successful:', data.user);
}
```

## Reset Password

If you forgot your password:

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find your user
3. Click **Send password reset email**
4. Or use the password reset flow in the app (if implemented)

## Create New Account

If you don't have an account:

1. Go to `/auth` page
2. Click "Don't have an account?" to switch to Sign Up
3. Enter your email and password
4. Check your email for verification link

## Check Environment Variables

Make sure your `.env` file has correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Common Error Messages

| Error Message | Solution |
|--------------|----------|
| "Invalid login credentials" | Check email/password, verify account exists |
| "Email not confirmed" | Verify email via link sent to your inbox |
| "User already registered" | Use Sign In instead of Sign Up |
| "Network error" | Check internet connection, check Supabase status |
| "Request timeout" | Check network, try again |

## Still Having Issues?

1. **Check Supabase Status:** https://status.supabase.com
2. **Check Browser Console:** Look for detailed error messages
3. **Try Incognito Mode:** Rule out browser extensions/cache issues
4. **Check Network Tab:** See if requests are being made

