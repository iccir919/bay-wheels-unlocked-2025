import { PGlite } from "@electric-sql/pglite";
import { queries } from "./queries.js";

const DB_PATH = "./db/pglite";
// Usage: npm run db:test <queryName> <limit>
const queryName = process.argv[2]; 
const rowLimit = process.argv[3] ? parseInt(process.argv[3]) : 20;

async function runTest() {
  const db = new PGlite(DB_PATH);
  console.log("🚀 Initializing Test Runner...");

  if (queryName) {
    if (queries[queryName]) {
      await executeAndLog(db, queryName, queries[queryName]);
    } else {
      console.error(`❌ Query "${queryName}" not found in queries.js`);
      console.log("Available queries:", Object.keys(queries).join(", "));
    }
  } else {
    console.log("📝 Running summary of all queries (Top 5 rows each)...");
    for (const [name, sql] of Object.entries(queries)) {
      await executeAndLog(db, name, sql, 5);
    }
  }

  await db.close();
}

async function executeAndLog(db, name, sql, customLimit) {
  const limit = customLimit || rowLimit;
  console.log(`\n--- [ QUERY: ${name} ] ---`);
  
  try {
    const start = Date.now();
    const { rows } = await db.query(sql);
    const duration = Date.now() - start;

    if (rows.length === 0) {
      console.log("⚠️ No results returned. Check if your tables are populated.");
    } else {
      // Show a slice based on the limit provided
      console.table(rows.slice(0, limit));
      
      if (rows.length > limit) {
        console.log(`... and ${rows.length - limit} more rows hidden.`);
      }
      console.log(`✨ Processed ${rows.length} rows in ${duration}ms`);
    }
  } catch (err) {
    console.error(`❌ SQL Error in "${name}":`);
    console.error(`   ${err.message}`);
  }
}

runTest().catch(console.error);