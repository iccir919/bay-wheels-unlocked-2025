import fs from "fs";
import { PGlite } from "@electric-sql/pglite";

export async function createIndexes() {
  const db = new PGlite("./db/pglite");

  const sql = fs.readFileSync("./db/indexes.sql", "utf-8");

  await db.exec(sql);
  await db.close();
}

createIndexes().catch(err => {
  console.error(err);
  process.exit(1);
});