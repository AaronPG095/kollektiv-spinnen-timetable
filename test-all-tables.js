/**
 * Diagnostic script to test all Supabase tables
 * Run with: node test-all-tables.js
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ndhfsjroztkhlupzvjzh.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaGZzanJvenRraGx1cHp2anpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNTAsImV4cCI6MjA2OTQ0NzA1MH0.yv347okmpPHvFajXo1-ap5tjzbP-gCgMb3fCYcFhVkg';

const tables = [
  { name: 'events', query: 'select * from events limit 1' },
  { name: 'faqs', query: 'select * from faqs limit 1' },
  { name: 'ticket_settings', query: 'select * from ticket_settings limit 1' },
  { name: 'ticket_purchases', query: 'select * from ticket_purchases limit 1' },
  { name: 'about_page_content', query: 'select * from about_page_content limit 1' },
  { name: 'about_page_photos', query: 'select * from about_page_photos limit 1' },
  { name: 'user_roles', query: 'select * from user_roles limit 1' },
  { name: 'profiles', query: 'select * from profiles limit 1' },
];

async function testTable(table) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table.name}?select=*&limit=1`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const status = response.status;
    const statusText = response.statusText;
    
    if (status === 200) {
      const data = await response.json();
      return {
        table: table.name,
        status: '✅ EXISTS',
        statusCode: status,
        rowCount: Array.isArray(data) ? data.length : 'N/A',
        error: null,
      };
    } else if (status === 404) {
      return {
        table: table.name,
        status: '❌ NOT FOUND',
        statusCode: status,
        error: 'Table does not exist',
      };
    } else {
      const errorText = await response.text();
      return {
        table: table.name,
        status: '⚠️ ERROR',
        statusCode: status,
        statusText,
        error: errorText.substring(0, 200),
      };
    }
  } catch (error) {
    return {
      table: table.name,
      status: '❌ EXCEPTION',
      error: error.message,
    };
  }
}

async function testAllTables() {
  console.log('\n🔍 Testing Supabase Tables...\n');
  console.log(`URL: ${SUPABASE_URL}\n`);
  
  const results = await Promise.all(tables.map(testTable));
  
  console.log('Results:');
  console.log('='.repeat(80));
  
  results.forEach(result => {
    console.log(`\n${result.table}:`);
    console.log(`  Status: ${result.status}`);
    if (result.statusCode) {
      console.log(`  HTTP Status: ${result.statusCode} ${result.statusText || ''}`);
    }
    if (result.rowCount !== undefined) {
      console.log(`  Sample Rows: ${result.rowCount}`);
    }
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  
  const existing = results.filter(r => r.status === '✅ EXISTS').length;
  const missing = results.filter(r => r.status === '❌ NOT FOUND').length;
  const errors = results.filter(r => r.status.includes('ERROR') || r.status.includes('EXCEPTION')).length;
  
  console.log(`\nSummary:`);
  console.log(`  ✅ Existing: ${existing}/${tables.length}`);
  console.log(`  ❌ Missing: ${missing}/${tables.length}`);
  console.log(`  ⚠️  Errors: ${errors}/${tables.length}`);
  
  if (missing > 0) {
    console.log(`\n⚠️  Missing tables need migrations applied!`);
    const missingTables = results.filter(r => r.status === '❌ NOT FOUND').map(r => r.table);
    console.log(`   Tables: ${missingTables.join(', ')}`);
  }
}

testAllTables().catch(console.error);

