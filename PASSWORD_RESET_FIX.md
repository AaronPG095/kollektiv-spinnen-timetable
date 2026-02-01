# Password Reset System Fix

## Issues Fixed

### 1. ✅ Localhost Redirect URL Issue (CRITICAL)
**Problem**: Password reset emails were using `localhost:3000` URLs in production, making reset links unusable.

**Solution**: 
- Created `getBaseUrl()` helper function in `AuthContext.tsx`
- Uses `VITE_APP_URL` environment variable in production
- Falls back to `window.location.origin` in development
- Applied to both `resetPasswordForEmail` and `signUp` functions

**Production URL**: `https://kollektiv-spinnen-festival.vercel.app`

### 2. ✅ Error Parameter Handling
**Problem**: Expired/invalid OTP links showed generic errors instead of specific messages.

**Solution**:
- Added detection for `error`, `error_code`, and `error_description` parameters in URL hash
- Maps error codes to user-friendly messages:
  - `otp_expired` → "This password reset link has expired. Please request a new one."
  - `access_denied` → "Access denied. Please request a new password reset link."
  - Generic errors → Shows decoded error description

### 3. ✅ User-Friendly Error Messages
**Added Translation Keys**:
- `resetLinkExpired` (DE/EN)
- `resetLinkInvalid` (DE/EN)
- `resetLinkAccessDenied` (DE/EN)
- `requestNewResetLink` (DE/EN)

### 4. ✅ Request New Reset Link Functionality
**Features**:
- "Request New Reset Link" button appears when errors are detected
- If user email is available from session, directly sends new reset email
- Otherwise, navigates to `/auth?mode=forgot-password` with forgot password mode active
- Auth page now handles `mode=forgot-password` query parameter

## Files Modified

1. **`src/contexts/AuthContext.tsx`**
   - Added `getBaseUrl()` helper function
   - Updated `resetPasswordForEmail()` to use production URL
   - Updated `signUp()` to use production URL

2. **`src/pages/ResetPassword.tsx`**
   - Added error parameter detection in `useEffect`
   - Added error code mapping to user-friendly messages
   - Added "Request New Reset Link" button with functionality
   - Improved error state UI

3. **`src/pages/Auth.tsx`**
   - Added support for `mode=forgot-password` query parameter
   - Automatically activates forgot password mode when parameter is present

4. **`src/contexts/LanguageContext.tsx`**
   - Added German and English translations for error messages

## Environment Variable Required

**For Production**: Set `VITE_APP_URL` environment variable:
```env
VITE_APP_URL=https://kollektiv-spinnen-festival.vercel.app
```

**For Vercel**: Add this in Project Settings → Environment Variables

## Supabase Configuration

**Important**: Ensure your production URL is added to Supabase allowed redirect URLs:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Settings** → **Authentication** → **URL Configuration**
3. Add to **Redirect URLs**:
   - `https://kollektiv-spinnen-festival.vercel.app/auth/reset-password`
   - `https://kollektiv-spinnen-festival.vercel.app/`

## Testing Checklist

- [ ] Test password reset email in production (verify it uses production URL, not localhost)
- [ ] Test with expired reset links (should show appropriate error message)
- [ ] Test "Request New Reset Link" button functionality
- [ ] Test navigation to auth page with forgot password mode
- [ ] Verify error messages display correctly in both German and English
- [ ] Verify Supabase dashboard has production URL in allowed redirect URLs

## Next Steps

1. **Set Environment Variable**: Add `VITE_APP_URL=https://kollektiv-spinnen-festival.vercel.app` to Vercel project settings
2. **Update Supabase**: Add production URL to allowed redirect URLs in Supabase dashboard
3. **Test**: Send a test password reset email and verify the link uses the production URL
4. **Deploy**: Deploy the changes to production
