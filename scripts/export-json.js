// scripts/export-json.js
import fs from "fs";
import { PGlite } from "@electric-sql/pglite";
import { queries } from "./queries.js";

const db = new PGlite("./db/pglite");
const OUT_DIR = "./data/derived";

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [name, sql] of Object.entries(queries)) {
  const { rows } = await db.query(sql);
  fs.writeFileSync(
    `${OUT_DIR}/${name}.json`,
    JSON.stringify(rows, null, 2)
  );
  console.log(`📄 Generated ${name}.json`);
}

await db.close();
