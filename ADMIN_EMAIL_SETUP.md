# Admin Email-Based Setup Guide

## Changes Made

### 1. ✅ Admin Check Now Uses Email Instead of User ID
- Updated `AuthContext.tsx` to check admin status by email address
- Checks `admin_emails` table first (email-based)
- Falls back to `user_roles` table for backward compatibility

### 2. ✅ All Pages Are Now Accessible
- Removed admin protection from `/admin` route
- All users can access all pages
- Non-admin users see a friendly message on admin page instead of being redirected

### 3. ✅ Login Button Always Visible
- Login button is now always visible in the header
- Allows users to log in or switch accounts at any time

## How to Grant Admin Privileges by Email

### Option 1: Via SQL Editor (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com) → SQL Editor
2. Run this SQL (replace with your email):

```sql
INSERT INTO public.admin_emails (email)
VALUES ('your-email@example.com')
ON CONFLICT (email) DO NOTHING;
```

### Option 2: Via Table Editor

1. Go to Supabase Dashboard → **Table Editor** → `admin_emails`
2. Click **Insert** → **Insert row**
3. Fill in:
   - `email`: Your email address (e.g., `your-email@example.com`)
4. Click **Save**

### Option 3: Multiple Admins at Once

```sql
INSERT INTO public.admin_emails (email) VALUES
  ('admin1@example.com'),
  ('admin2@example.com'),
  ('admin3@example.com')
ON CONFLICT (email) DO NOTHING;
```

## How It Works

1. **Email-Based Check (Primary):**
   - System checks if user's email exists in `admin_emails` table
   - Email is normalized (lowercase, trimmed) for matching

2. **User ID-Based Check (Fallback):**
   - If email check fails, falls back to `user_roles` table
   - Maintains backward compatibility with existing admin users

3. **Admin Status Updates:**
   - Admin status is checked when user logs in
   - Updates automatically when auth state changes

## Verify Admin Status

Run this in browser console after logging in:

```javascript
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  console.log('Your email:', user.email);
  
  const { data, error } = await supabase
    .from('admin_emails')
    .select('*')
    .eq('email', user.email.toLowerCase().trim())
    .single();
  
  if (data && !error) {
    console.log('✅ You have admin privileges!');
  } else {
    console.log('❌ You do NOT have admin privileges');
  }
}
```

## Benefits

- ✅ **Easier Management:** Grant admin by email without needing user ID
- ✅ **More Flexible:** Works even if user hasn't signed up yet
- ✅ **Backward Compatible:** Still supports user_id-based admin via `user_roles`
- ✅ **Better UX:** All pages accessible, login always available

## Migration

Run the migration to create the `admin_emails` table:

```sql
-- File: supabase/migrations/20250115000003_add_email_based_admin.sql
-- Run this in Supabase Dashboard → SQL Editor
```

