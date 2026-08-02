const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const sql = fs.readFileSync('square-migration.sql', 'utf8');
  const stmts = sql.split(';').filter(s => s.trim().length > 0);
  for (const stmt of stmts) {
    const { error } = await supabase.rpc('exec_sql', { sql: stmt });
    if (error) {
      console.log('Using pg directly for alter table if rpc fails...');
    }
  }
}
run();
