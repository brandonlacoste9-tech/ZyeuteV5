const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres:kHDQJHWAPzxpUXQlXIsKwXPamtQPnwiU@trolley.proxy.rlwy.net:44815/railway'
  });
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');
    
    const sql = fs.readFileSync('apply-critical-migrations.sql', 'utf8');
    console.log('Executing migration...');
    await client.query(sql);
    console.log('SUCCESS! Migration completed!');
    
    await client.end();
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

runMigration();
