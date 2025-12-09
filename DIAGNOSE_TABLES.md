# Database Tables Diagnostic Guide

## Quick Test Script

Run this to test all tables:
```bash
node test-all-tables.js
```

## Manual Testing in Browser Console

Open your browser console and run:

```javascript
// Test Events (should work)
const { data: events, error: eventsError } = await supabase.from('events').select('*').limit(1);
console.log('Events:', eventsError ? '❌ ' + eventsError.message : '✅ ' + events.length + ' rows');

// Test FAQs
const { data: faqs, error: faqsError } = await supabase.from('faqs').select('*').limit(1);
console.log('FAQs:', faqsError ? '❌ ' + faqsError.message : '✅ ' + faqs.length + ' rows');

// Test Ticket Settings
const { data: ticketSettings, error: ticketSettingsError } = await supabase.from('ticket_settings').select('*').limit(1);
console.log('Ticket Settings:', ticketSettingsError ? '❌ ' + ticketSettingsError.message : '✅ ' + ticketSettings.length + ' rows');

// Test Ticket Purchases
const { data: ticketPurchases, error: ticketPurchasesError } = await supabase.from('ticket_purchases').select('*').limit(1);
console.log('Ticket Purchases:', ticketPurchasesError ? '❌ ' + ticketPurchasesError.message : '✅ ' + ticketPurchases.length + ' rows');

// Test About Page Content
const { data: aboutContent, error: aboutContentError } = await supabase.from('about_page_content').select('*').limit(1);
console.log('About Page Content:', aboutContentError ? '❌ ' + aboutContentError.message : '✅ ' + (aboutContent?.length || 0) + ' rows');

// Test About Page Photos
const { data: aboutPhotos, error: aboutPhotosError } = await supabase.from('about_page_photos').select('*').limit(1);
console.log('About Page Photos:', aboutPhotosError ? '❌ ' + aboutPhotosError.message : '✅ ' + (aboutPhotos?.length || 0) + ' rows');
```

## Common Issues

### 1. Table Doesn't Exist (404 Error)
**Error:** `relation "public.table_name" does not exist`
**Solution:** Run the migration SQL in Supabase Dashboard → SQL Editor

### 2. RLS Policy Blocking Access
**Error:** Empty array returned, no error but no data
**Solution:** Check RLS policies allow public/anonymous access

### 3. Missing Columns
**Error:** `column "column_name" does not exist`
**Solution:** Run migration that adds the column

## Tables That Should Exist

1. ✅ `events` - Working
2. ❓ `faqs` - Check if exists
3. ❓ `ticket_settings` - Check if exists  
4. ❓ `ticket_purchases` - Check if exists
5. ❓ `about_page_content` - Check if exists
6. ❓ `about_page_photos` - Check if exists
7. ❓ `user_roles` - Check if exists
8. ❓ `profiles` - Check if exists

## Migration Files to Apply

If tables are missing, apply these migrations in order:

1. `20250730104551_create_events.sql` - Events table (already working)
2. `20250804205926_d6412176-3c2a-4191-9ead-d94549e4e517.sql` - FAQs table
3. `20251208113520_create_ticket_settings.sql` - Ticket settings
4. `20251208140000_create_ticket_purchases.sql` - Ticket purchases
5. `20251208120000_create_about_page.sql` - About page tables

## Check RLS Policies

In Supabase Dashboard → Authentication → Policies, verify:

- **events**: Public can SELECT
- **faqs**: Public can SELECT visible FAQs
- **ticket_settings**: Public can SELECT
- **ticket_purchases**: Public can SELECT confirmed purchases
- **about_page_content**: Public can SELECT
- **about_page_photos**: Public can SELECT

