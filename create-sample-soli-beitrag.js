// Script to create a sample confirmed Soli-Beitrag for testing
// Run with: node create-sample-soli-beitrag.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
  try {
    const envFile = readFileSync(join(__dirname, '.env'), 'utf-8');
    const envVars = {};
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    return envVars;
  } catch (error) {
    console.error('Error reading .env file:', error.message);
    return {};
  }
}

const env = loadEnv();

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createSampleSoliBeitrag() {
  console.log('Creating sample Soli-Beitrag...');

  // Sample data for a confirmed Soli-Beitrag
  const samplePurchase = {
    contribution_type: 'earlyBird', // Options: 'earlyBird', 'normal', 'reducedEarlyBird', 'reducedNormal'
    role: 'bar', // Options: 'bar', 'kuechenhilfe', 'springerRunner', 'springerToilet', 'abbau', 'aufbau', 'awareness', 'schichtleitung'
    price: 100.00,
    purchaser_name: 'Max Mustermann',
    purchaser_email: 'max.mustermann@example.com',
    status: 'confirmed', // This will show up in "Bestätigte Soli-Beiträge"
    payment_reference: 'PAY-REF-12345',
    notes: 'Sample Soli-Beitrag for testing admin area',
    user_id: null, // Optional: can be set to a user ID if needed
  };

  try {
    const { data, error } = await supabase
      .from('soli_contribution_purchases')
      .insert([samplePurchase])
      .select()
      .single();

    if (error) {
      console.error('Error creating sample Soli-Beitrag:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      process.exit(1);
    }

    console.log('✅ Sample Soli-Beitrag created successfully!');
    console.log('Purchase ID:', data.id);
    console.log('Status:', data.status);
    console.log('Role:', data.role);
    console.log('Contribution Type:', data.contribution_type);
    console.log('Price:', data.price, '€');
    console.log('Purchaser:', data.purchaser_name, `(${data.purchaser_email})`);
    console.log('\nThis purchase should now appear in the admin area under "Bestätigte Soli-Beiträge"');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

createSampleSoliBeitrag();
