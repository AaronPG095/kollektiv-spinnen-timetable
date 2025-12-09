# How to Check Admin Status

## Quick Check in Browser Console

1. **Open your app** in the browser
2. **Open browser console** (F12 or Cmd+Option+I)
3. **Make sure you're logged in**
4. **Run this code:**

```javascript
// Check if you're logged in
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  console.log('❌ Not logged in - please log in first');
} else {
  console.log('✅ Logged in as:', user.email);
  console.log('   User ID:', user.id);
  
  // Check admin status
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      console.log('❌ You do NOT have admin privileges');
      console.log('💡 See below for how to grant admin access');
    } else {
      console.log('⚠️  Error checking admin:', error.message);
    }
  } else {
    console.log('✅ You HAVE admin privileges!');
    console.log('   Role data:', data);
  }
}
```

## Check in Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Table Editor** → `user_roles`
4. Look for a row with:
   - `user_id` = your user ID
   - `role` = `admin`

## How to Grant Admin Privileges

### Option 1: Via SQL Editor (Recommended)

1. **Find your User ID:**
   - Go to Supabase Dashboard → **Authentication** → **Users**
   - Find your email and copy the User UUID

2. **Run this SQL:**
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('YOUR_USER_ID_HERE', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

### Option 2: Via Table Editor

1. Go to **Table Editor** → `user_roles`
2. Click **Insert** → **Insert row**
3. Fill in:
   - `user_id`: Your user UUID (from Authentication → Users)
   - `role`: `admin`
4. Click **Save**

## Verify Admin Access

After granting admin privileges:

1. **Refresh your browser** (or log out and back in)
2. **Try accessing `/admin` route**
3. **Check browser console** - you should see admin status as `true`

## Troubleshooting

### "PGRST116" Error
- This means no admin role found for your user
- Grant admin privileges using the steps above

### "permission denied" Error
- RLS policy might be blocking access
- Check that `user_roles` table has proper RLS policies
- Admins should be able to view all roles

### Admin Status Not Updating
- Try logging out and back in
- Clear browser cache/localStorage
- Check browser console for errors

