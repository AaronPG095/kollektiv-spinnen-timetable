// Quick test script to check Supabase connection
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Read .env file manually
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);
console.log('Key present:', !!SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      console.error('   Code:', testError.code);
      console.error('   Message:', testError.message);
      console.error('   Details:', testError.details);
      console.error('   Hint:', testError.hint);
      return;
    }
    
    console.log('✅ Basic connection works');
    
    console.log('\n2. Testing full query...');
    const { data, error, count } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('is_visible', true);
    
    if (error) {
      console.error('❌ Query failed:', error);
      return;
    }
    
    console.log(`✅ Query successful: Found ${count || data?.length || 0} events`);
    
    if (data && data.length > 0) {
      console.log('\n3. Sample event:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('\n⚠️  No events found in database');
      console.log('   This could mean:');
      console.log('   - The events table is empty');
      console.log('   - All events have is_visible = false');
      console.log('   - RLS policies are blocking access');
    }
    
    console.log('\n4. Testing RLS policies...');
    const { data: allData, error: allError } = await supabase
      .from('events')
      .select('*');
    
    if (allError) {
      console.error('❌ RLS test failed:', allError.message);
    } else {
      console.log(`✅ RLS allows access: Found ${allData?.length || 0} total events`);
      if (allData && allData.length > 0) {
        const visibleCount = allData.filter(e => e.is_visible === true).length;
        console.log(`   - Visible: ${visibleCount}`);
        console.log(`   - Hidden: ${allData.length - visibleCount}`);
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testConnection();

