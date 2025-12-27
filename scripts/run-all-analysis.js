import fs from "fs";
import path from "path";
import { PGlite } from "@electric-sql/pglite";
import { queries } from "./queries.js";

const DB_PATH = "./db/pglite";
const OUTPUT_FILE = "./data/derived/master_analysis.json";

async function runAll() {
  const db = new PGlite(DB_PATH);
  const masterData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      queryCount: Object.keys(queries).length
    },
    results: {}
  };

  console.log("📊 Starting Master Analysis...");

  for (const [name, sql] of Object.entries(queries)) {
    try {
      const start = Date.now();
      const { rows } = await db.query(sql);
      masterData.results[name] = rows;
      
      console.log(`✅ [${Date.now() - start}ms] Processed: ${name}`);
    } catch (err) {
      console.error(`❌ Error in ${name}:`, err.message);
    }
  }

  // Ensure directory exists
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  
  // Save everything to one file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(masterData, null, 2));
  
  console.log(`\n📦 Master analysis saved to: ${OUTPUT_FILE}`);
  await db.close();
}

runAll().catch(console.error);