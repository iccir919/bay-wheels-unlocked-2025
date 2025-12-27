import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { PGlite } from "@electric-sql/pglite";

export async function ingestStations() {
  const startTime = Date.now();
  const db = new PGlite("./db/pglite");
  const DATA_DIR = "./data/raw";

  console.log("🏗️  Deriving stations from trip CSVs");

  const stations = new Map();
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".csv"));

  console.log(`📂 Scanning ${files.length} CSV files for stations`);

  for (const file of files) {
    console.log(`➡️  Reading ${file}`);

    const stream = fs
      .createReadStream(path.join(DATA_DIR, file))
      .pipe(csv());

    for await (const row of stream) {
      if (row.start_station_id && row.start_station_id.trim() !== "" && row.start_station_name) {
        stations.set(row.start_station_id, {
          station_id: row.start_station_id,
          name: row.start_station_name,
          latitude: parseFloat(row.start_lat) || null,
          longitude: parseFloat(row.start_lng) || null,
        });
      }

      if (row.end_station_id && row.end_station_id.trim() !== "" && row.end_station_name) {
        stations.set(row.end_station_id, {
          station_id: row.end_station_id,
          name: row.end_station_name,
          latitude: parseFloat(row.end_lat) || null,
          longitude: parseFloat(row.end_lng) || null,
        });
      }
    }
  }

  console.log(`📍 Unique stations found: ${stations.size.toLocaleString()}`);

  await db.exec("BEGIN");

  let inserted = 0;

  try {
    for (const station of stations.values()) {
      await db.query(
        `
        INSERT INTO stations (station_id, name, latitude, longitude)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (station_id) DO UPDATE
        SET
          name = EXCLUDED.name,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude
        `,
        [
          station.station_id,
          station.name,
          station.latitude,
          station.longitude,
        ]
      );

      inserted++;

      if (inserted % 500 === 0) {
        console.log(`   … ${inserted.toLocaleString()} stations upserted`);
      }
    }

    await db.exec("COMMIT");
  } catch (err) {
    await db.exec("ROLLBACK");
    console.error("❌ Station ingestion failed", err.message);
    throw err;
  }

  await db.close();

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `✅ Stations ingestion complete: ${inserted.toLocaleString()} stations (${seconds}s)`
  );
}

ingestStations().catch(err => {
  console.error(err);
  process.exit(1);
});
