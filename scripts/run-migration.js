/**
 * Run Supabase migrations using the service role key
 * Usage: node scripts/run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\nRunning migration: ${filename}`);
  console.log('='.repeat(50));
  
  // Split SQL into statements (simple split, won't work for all edge cases)
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const statement of statements) {
    if (!statement) continue;
    
    try {
      // Use rpc to execute raw SQL
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Try direct query if rpc doesn't exist
        throw error;
      }
      successCount++;
      process.stdout.write('.');
    } catch (err) {
      errorCount++;
      // Log error but continue
      if (!err.message?.includes('already exists')) {
        console.error(`\nWarning: ${err.message?.substring(0, 100)}`);
      }
    }
  }
  
  console.log(`\nCompleted: ${successCount} successful, ${errorCount} errors/skipped`);
}

async function main() {
  console.log('Spectra Praxis Database Migration');
  console.log('==================================');
  console.log(`Target: ${supabaseUrl}`);
  
  // Test connection
  const { data, error } = await supabase.from('profiles').select('count').limit(1);
  
  if (error && error.code !== 'PGRST116') {
    // PGRST116 means table doesn't exist, which is expected before migration
    console.log('Connection test result:', error.message);
  }
  
  console.log('\nNote: This script requires running SQL manually in Supabase Dashboard.');
  console.log('Go to: https://supabase.com/dashboard/project/nwwesogezwemoevhfvgi/sql/new');
  console.log('\nMigration files to run in order:');
  console.log('1. supabase/migrations/001_initial_schema.sql');
  console.log('2. supabase/migrations/002_indexes_rls.sql');
  console.log('3. supabase/migrations/003_functions_triggers.sql');
}

main().catch(console.error);
