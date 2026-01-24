/**
 * Direct Supabase migration using Management API
 * This creates an exec_sql function first, then runs migrations
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref from URL
const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

async function executeSql(sql) {
  // Use the Supabase Management API for SQL execution
  // This requires the service role key
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ sql_query: sql })
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL execution failed: ${text}`);
  }
  
  return response.json().catch(() => ({}));
}

async function createExecSqlFunction() {
  console.log('Creating exec_sql function...');
  
  // First, try to create the function via direct POST
  // This won't work via REST API, so we'll use a workaround
  
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result JSONB;
    BEGIN
      EXECUTE sql_query;
      RETURN '{"success": true}'::JSONB;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('error', SQLERRM);
    END;
    $$;
  `;
  
  // Unfortunately, we can't create functions via REST API
  // We need to provide instructions for manual execution
  console.log('\n' + '='.repeat(60));
  console.log('MANUAL STEP REQUIRED');
  console.log('='.repeat(60));
  console.log('\nPlease run the following SQL in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new\n');
  console.log(createFunctionSql);
  console.log('\n' + '='.repeat(60));
}

async function readMigrationFile(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  return fs.readFileSync(filePath, 'utf8');
}

async function printMigrationInstructions() {
  console.log('\n' + '█'.repeat(60));
  console.log('  SUPABASE MIGRATION INSTRUCTIONS');
  console.log('█'.repeat(60));
  
  console.log(`
Since direct SQL execution requires the Supabase Dashboard, 
please follow these steps:

1. Open Supabase SQL Editor:
   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new

2. Run each migration file in order:
`);

  const migrations = [
    '001_initial_schema.sql',
    '002_indexes_rls.sql', 
    '003_functions_triggers.sql'
  ];
  
  for (let i = 0; i < migrations.length; i++) {
    const filename = migrations[i];
    const content = await readMigrationFile(filename);
    const lineCount = content.split('\n').length;
    
    console.log(`   ${i + 1}. ${filename} (${lineCount} lines)`);
  }
  
  console.log(`
3. Or run all at once by copying the combined SQL below.

${'='.repeat(60)}
COMBINED MIGRATION SQL - Copy everything below this line:
${'='.repeat(60)}
`);

  // Output combined SQL
  for (const filename of migrations) {
    const content = await readMigrationFile(filename);
    console.log(`-- ========== ${filename} ==========`);
    console.log(content);
    console.log('\n');
  }
  
  console.log('='.repeat(60));
  console.log('END OF MIGRATION SQL');
  console.log('='.repeat(60));
}

async function main() {
  console.log('Spectra Praxis - Supabase Migration Helper');
  console.log('Project:', PROJECT_REF);
  console.log('URL:', SUPABASE_URL);
  
  await printMigrationInstructions();
}

main().catch(console.error);
