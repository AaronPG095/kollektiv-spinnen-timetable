// Script to add universal limit columns to ticket_settings table
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
let envVars = {};
try {
  const envContent = readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
} catch (error) {
  console.error('Error reading .env file:', error.message);
  process.exit(1);
}

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('   Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Use service role key if available, otherwise use anon key
const supabase = createClient(
  SUPABASE_URL, 
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
);

async function checkColumnsExist() {
  console.log('\n📋 Checking current database state...');
  
  // Check if columns exist by trying to query them
  const { data, error } = await supabase
    .from('ticket_settings')
    .select('normal_total_limit, early_bird_total_limit')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();
  
  if (error) {
    // If error is about missing columns, that's expected
    if (error.message?.includes('normal_total_limit') || error.message?.includes('early_bird_total_limit')) {
      console.log('✅ Columns do not exist - need to add them');
      return { normal_exists: false, early_bird_exists: false };
    }
    // Other errors might mean table doesn't exist or other issues
    console.log('⚠️  Could not check columns:', error.message);
    return { normal_exists: false, early_bird_exists: false };
  }
  
  // If query succeeds, columns exist
  const normal_exists = data.normal_total_limit !== undefined;
  const early_bird_exists = data.early_bird_total_limit !== undefined;
  
  console.log(`   normal_total_limit: ${normal_exists ? '✅ exists' : '❌ missing'}`);
  console.log(`   early_bird_total_limit: ${early_bird_exists ? '✅ exists' : '❌ missing'}`);
  
  return { normal_exists, early_bird_exists };
}

async function addColumns() {
  console.log('\n🔧 Attempting to add columns...');
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log('⚠️  Service role key not found. DDL operations require service role key.');
    console.log('\n📝 Please run this SQL manually in Supabase Dashboard → SQL Editor:\n');
    console.log('─'.repeat(60));
    const sql = readFileSync('fix_universal_limits.sql', 'utf-8');
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('\n💡 To get your service role key:');
    console.log('   1. Go to Supabase Dashboard → Settings → API');
    console.log('   2. Copy the "service_role" key (keep it secret!)');
    console.log('   3. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
    console.log('   4. Run this script again\n');
    return false;
  }
  
  // Try to execute SQL using RPC (if a function exists) or direct SQL execution
  // Note: Supabase REST API doesn't support DDL directly, so we'll need to use
  // a stored procedure or provide manual instructions
  
  console.log('⚠️  Supabase REST API does not support DDL operations (ALTER TABLE)');
  console.log('   You need to run the SQL manually in Supabase Dashboard.\n');
  console.log('📝 SQL to execute:\n');
  console.log('─'.repeat(60));
  const sql = readFileSync('fix_universal_limits.sql', 'utf-8');
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\n📍 Steps:');
  console.log('   1. Go to https://app.supabase.com');
  console.log('   2. Select your project');
  console.log('   3. Go to SQL Editor (left sidebar)');
  console.log('   4. Click "New Query"');
  console.log('   5. Paste the SQL above');
  console.log('   6. Click "Run" (or press Cmd/Ctrl + Enter)\n');
  
  return false;
}

async function verifyColumns() {
  console.log('\n✅ Verifying columns were added...');
  
  const { data, error } = await supabase
    .from('ticket_settings')
    .select('normal_total_limit, early_bird_total_limit')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();
  
  if (error) {
    if (error.message?.includes('normal_total_limit') || error.message?.includes('early_bird_total_limit')) {
      console.log('❌ Columns still missing. Please run the SQL manually.');
      return false;
    }
    console.log('⚠️  Error verifying:', error.message);
    return false;
  }
  
  const normal_exists = data.normal_total_limit !== undefined;
  const early_bird_exists = data.early_bird_total_limit !== undefined;
  
  if (normal_exists && early_bird_exists) {
    console.log('✅ Both columns exist!');
    console.log('   normal_total_limit:', data.normal_total_limit ?? 'NULL');
    console.log('   early_bird_total_limit:', data.early_bird_total_limit ?? 'NULL');
    return true;
  } else {
    console.log('❌ Some columns are still missing:');
    console.log(`   normal_total_limit: ${normal_exists ? '✅' : '❌'}`);
    console.log(`   early_bird_total_limit: ${early_bird_exists ? '✅' : '❌'}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Adding Universal Limit Columns to Supabase\n');
  
  try {
    // Step 1: Check current state
    const state = await checkColumnsExist();
    
    // Step 2: Add columns if needed
    if (!state.normal_exists || !state.early_bird_exists) {
      const added = await addColumns();
      if (!added) {
        // If manual execution needed, wait a bit and then verify
        console.log('\n⏳ After running the SQL manually, you can run this script again to verify.');
        process.exit(0);
      }
    } else {
      console.log('\n✅ All columns already exist!');
    }
    
    // Step 3: Verify
    await verifyColumns();
    
    console.log('\n🎉 Done! The universal limits feature should now work.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
