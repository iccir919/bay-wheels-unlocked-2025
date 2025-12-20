import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import db from "../db/index.js";

const DATA_FOLDER = "./data";
const BATCH_SIZE = 1000;

/**
 * Clean up ID strings to handle 'null' strings or empty spaces
 */
function normalizeStationId(id) {
  const v = id?.trim();
  if (!v || v.toLowerCase() === "null") return null;
  return v;
}

/**
 * PHASE 1: Sync stations
 * Scans all files for unique station IDs to prevent Foreign Key violations
 */
async function syncAllStations(files) {
  let batch = [];
  const seenIds = new Set();

  for (const file of files) {
    const parser = fs.createReadStream(file).pipe(parse({ columns: true }));

    for await (const row of parser) {
      const candidates = [
        { id: row.start_station_id, name: row.start_station_name, lat: row.start_lat, lng: row.start_lng },
        { id: row.end_station_id, name: row.end_station_name, lat: row.end_lat, lng: row.end_lng },
      ];

      for (const s of candidates) {
        const id = normalizeStationId(s.id);
        if (!id || seenIds.has(id)) continue;

        batch.push({
          station_id: id,
          name: s.name?.trim() || "Unknown Station",
          latitude: parseFloat(s.lat) || null,
          longitude: parseFloat(s.lng) || null,
        });
        seenIds.add(id);

        if (batch.length >= BATCH_SIZE) {
          await db.from('stations').upsert(batch, { onConflict: 'station_id' });
          batch = [];
        }
      }
    }
  }

  if (batch.length) {
    await db.from('stations').upsert(batch, { onConflict: 'station_id' });
  }
}

/**
 * PHASE 2: Import trips
 */
async function importTrips(files) {
  let batch = [];
  for (const file of files) {
    const parser = fs.createReadStream(file).pipe(parse({ columns: true }));

    for await (const row of parser) {
      const rideId = row.ride_id?.trim();
      if (!rideId) continue;

      batch.push({
        ride_id: rideId,
        rideable_type: row.rideable_type,
        started_at: row.started_at,
        ended_at: row.ended_at,
        duration_seconds: Math.floor((new Date(row.ended_at) - new Date(row.started_at)) / 1000),
        start_station_id: normalizeStationId(row.start_station_id),
        end_station_id: normalizeStationId(row.end_station_id),
        start_station_name: row.start_station_name,
        end_station_name: row.end_station_name,
        start_lat: parseFloat(row.start_lat) || null,
        start_lng: parseFloat(row.start_lng) || null,
        end_lat: parseFloat(row.end_lat) || null,
        end_lng: parseFloat(row.end_lng) || null,
        member_casual: row.member_casual,
      });

      if (batch.length >= BATCH_SIZE) {
        await db.from('trips').upsert(batch, { onConflict: 'ride_id' });
        batch = [];
      }
    }
  }

  if (batch.length) {
    await db.from('trips').upsert(batch, { onConflict: 'ride_id' });
  }
}

/**
 * Main Execution
 */
async function run() {
  const files = fs.readdirSync(DATA_FOLDER)
    .filter(f => f.endsWith(".csv"))
    .map(f => path.join(DATA_FOLDER, f));

  if (files.length === 0) {
    console.warn("No CSV files found in ./data folder.");
    return;
  }

  console.time("Total Import Time");
  
  console.log("🚀 Starting Phase 1: Syncing stations...");
  await syncAllStations(files);

  console.log("🚀 Starting Phase 2: Importing trips...");
  await importTrips(files);

  console.timeEnd("Total Import Time");
  console.log("✅ Import finished successfully.");
  
  if (db.end) await db.end();
}

run().catch(err => {
  console.error("❌ Fatal Import Error:", err);
  process.exit(1);
});