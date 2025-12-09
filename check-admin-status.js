/**
 * Check if current user has admin privileges
 * Run with: node check-admin-status.js
 * 
 * Note: This requires you to be logged in via the web app first,
 * or you can check directly in Supabase Dashboard
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ndhfsjroztkhlupzvjzh.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaGZzanJvenRraGx1cHp2anpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNTAsImV4cCI6MjA2OTQ0NzA1MH0.yv347okmpPHvFajXo1-ap5tjzbP-gCgMb3fCYcFhVkg';

console.log('\n🔍 Checking Admin Status...\n');
console.log('Note: To check your admin status, you need to:');
console.log('1. Be logged in to the web app');
console.log('2. Open browser console and run the check script there');
console.log('3. Or check directly in Supabase Dashboard\n');

console.log('📋 All users with admin role in database:');
console.log('='.repeat(60));

async function checkAllAdmins() {
  try {
    // Note: This will only work if you have service_role key or are an admin
    // For regular users, use the browser console method below
    const url = `${SUPABASE_URL}/rest/v1/user_roles?select=*&role=eq.admin`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      if (data.length === 0) {
        console.log('❌ No admin users found in database');
        console.log('\n💡 To grant admin privileges:');
        console.log('   1. Go to Supabase Dashboard → Table Editor → user_roles');
        console.log('   2. Insert a new row with:');
        console.log('      - user_id: (your user ID from auth.users)');
        console.log('      - role: admin');
      } else {
        console.log(`✅ Found ${data.length} admin user(s):\n`);
        data.forEach((role, index) => {
          console.log(`   ${index + 1}. User ID: ${role.user_id}`);
          console.log(`      Role: ${role.role}`);
          console.log(`      Created: ${role.created_at}\n`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log(`⚠️  Could not check admin users (HTTP ${response.status})`);
      console.log(`   Error: ${errorText.substring(0, 200)}`);
      console.log('\n💡 This is normal - RLS policies prevent viewing user_roles unless you are an admin.');
      console.log('   Use the browser console method below instead.\n');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAllAdmins();

console.log('\n' + '='.repeat(60));
console.log('\n📱 To check YOUR admin status in browser:');
console.log('   1. Open your app in browser');
console.log('   2. Open browser console (F12)');
console.log('   3. Run this code:\n');
console.log(`
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  console.log('❌ Not logged in');
} else {
  console.log('✅ Logged in as:', user.email);
  console.log('   User ID:', user.id);
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      console.log('❌ You do NOT have admin privileges');
      console.log('💡 To grant admin: Insert into user_roles (user_id, role) VALUES (' + user.id + ', \\'admin\\')');
    } else {
      console.log('⚠️  Error checking admin:', error.message);
    }
  } else {
    console.log('✅ You HAVE admin privileges!');
    console.log('   Role:', data);
  }
}
`);

console.log('\n💡 To grant admin privileges manually:');
console.log('   1. Go to Supabase Dashboard → SQL Editor');
console.log('   2. Run this SQL (replace USER_ID with your user ID):\n');
console.log(`
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
`);
console.log('\n   To find your user ID:');
console.log('   - Check browser console after logging in');
console.log('   - Or go to Supabase Dashboard → Authentication → Users');

