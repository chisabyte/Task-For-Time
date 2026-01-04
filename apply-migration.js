// One-time script to apply the cascade child deletion migration
// Run with: node apply-migration.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('📦 Reading migration file...');
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '012_cascade_child_deletion.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('🚀 Applying migration to database...');

  try {
    // Split the SQL by semicolons and execute each statement
    // This is a simple approach - for complex migrations, consider using Supabase CLI
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql RPC doesn't exist, we need to apply it differently
      // Try using the postgres connection directly
      console.log('⚠️  Direct RPC not available, applying via raw SQL execution...');

      // Alternative: Use the SQL editor or apply manually
      console.log('\n📋 Migration SQL to apply:\n');
      console.log('='.repeat(80));
      console.log(migrationSQL);
      console.log('='.repeat(80));
      console.log('\n');
      console.log('ℹ️  Please apply this migration manually using one of these methods:');
      console.log('   1. Copy the SQL above and run it in the Supabase SQL Editor');
      console.log('   2. Install Supabase CLI: npm install -g supabase');
      console.log('   3. Then run: supabase db push');
      console.log('\n📍 Supabase Dashboard SQL Editor:');
      console.log(`   ${supabaseUrl.replace('.supabase.co', '')}/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql/new`);
      return;
    }

    console.log('✅ Migration applied successfully!');
    console.log('📊 Results:', data);
  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    console.log('\n📋 You can apply this migration manually in Supabase SQL Editor:');
    console.log('='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));
  }
}

applyMigration();
