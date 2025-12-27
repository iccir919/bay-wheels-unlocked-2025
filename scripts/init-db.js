import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';

async function initDatabase() {
  console.log('Initializing database...');
  
  const db = new PGlite('./db/pglite');
  
  // Load and execute schema only (no indexes yet)
  const schema = readFileSync('./db/schema.sql', 'utf-8');
  await db.exec(schema);
  console.log('✓ Schema created');
  
  console.log('Database initialized successfully!');
  await db.close();
}

initDatabase().catch(console.error); 

