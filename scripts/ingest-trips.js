// scripts/ingest-trips.js
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { PGlite } from "@electric-sql/pglite";

export async function ingestTrips() {
  const db = new PGlite("./db/pglite");
  const DATA_DIR = "./data/raw";

  const insertTripSQL = `
    INSERT INTO trips (
      ride_id,
      rideable_type,
      started_at,
      ended_at,
      start_station_id,
      end_station_id,
      start_lat,
      start_lng,
      end_lat,
      end_lng,
      member_casual,
      duration_seconds
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
    )
    ON CONFLICT (ride_id) DO NOTHING;
  `;

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".csv"));
  console.log(`📂 Found ${files.length} trip CSV files`);

  for (const file of files) {
    const fileStart = Date.now();
    let rowCount = 0;

    console.log(`➡️  Processing ${file}`);

    await db.exec("BEGIN");

    const stream = fs
      .createReadStream(path.join(DATA_DIR, file))
      .pipe(csv());

    try {
      for await (const row of stream) {
        const duration =
          (new Date(row.ended_at) - new Date(row.started_at)) / 1000;

        await db.query(insertTripSQL, [
          row.ride_id,
          row.rideable_type,
          row.started_at,
          row.ended_at,
          row.start_station_id || null,
          row.end_station_id || null,
          parseFloat(row.start_lat) || null,
          parseFloat(row.start_lng) || null,
          parseFloat(row.end_lat) || null,
          parseFloat(row.end_lng) || null,
          row.member_casual,
          duration,
        ]);

        rowCount++;

        if (rowCount % 50_000 === 0) {
          console.log(`   … ${rowCount.toLocaleString()} rows`);
        }
      }

      await db.exec("COMMIT");

      const seconds = ((Date.now() - fileStart) / 1000).toFixed(1);
      console.log(
        `✅ ${file} → ${rowCount.toLocaleString()} rows (${seconds}s)`
      );
    } catch (err) {
      await db.exec("ROLLBACK");
      console.error(`❌ Failed processing ${file}`);
      throw err;
    }
  }

  await db.close();
  console.log("📦 Trip ingestion complete");
}
