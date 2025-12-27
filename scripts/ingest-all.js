// scripts/ingest-all.js
import { ingestStations } from "./ingest-stations.js";
import { ingestTrips } from "./ingest-trips.js";
import { createIndexes } from "./create-indexes.js";

async function ingestAll() {
  const start = Date.now();

  try {
    console.log("🚀 Starting full ingestion pipeline\n");

    console.log("🏗️  Ingesting stations...");
    await ingestStations();
    console.log("✅ Stations ingested\n");

    console.log("🚲 Ingesting trips...");
    await ingestTrips();
    console.log("✅ Trips ingested\n");

    console.log("⚡ Creating indexes...");
    await createIndexes();
    console.log("✅ Indexes created\n");

    const seconds = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`🎉 Pipeline complete in ${seconds}s`);
  } catch (err) {
    console.error("\n❌ Ingestion failed:");
    console.error(err);
    process.exit(1);
  }
}

ingestAll();
