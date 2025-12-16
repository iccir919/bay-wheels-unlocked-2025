// Import Bay Wheels 2025 data from local CSV files into the configured DB (Supabase or Local PG)
// NOTE: Run 'node scripts/init-schema.js' first.
// Run: node scripts/import-data.js or DB_TARGET=local node scripts/import-data.js

import db from "../db/index.js"
import fs from "fs"
import csv from "csv-parser"
import path, { parse } from "path"

const BATCH_SIZE = 1000
const DATA_FOLDER = "./data"


function parseCSV(filepath) {
    return new Promise((resolve, reject) => {
        const results = []

        fs.createReadStream(filepath)
            .pipe(csv())
            .on("data", (row) => {
                results.push(row)
            })
            .on("end", () => {
                resolve(results)
            })
            .on("error", (err) => {
                reject(err)
            })
    })
}


function transformTrip(row) {
    // Transform CSV row to match database schema
    return {
    ride_id: row.ride_id?.trim() || null,
    rideable_type: row.rideable_type?.trim() || null,
    started_at: row.started_at?.trim() || null,
    ended_at: row.ended_at?.trim() || null,
    start_station_name: row.start_station_name?.trim() || null,
    start_station_id: row.start_station_id?.trim() || null,
    end_station_name: row.end_station_name?.trim() || null,
    end_station_id: row.end_station_id?.trim() || null,
    start_lat: row.start_lat ? parseFloat(row.start_lat) : null,
    start_lng: row.start_lng ? parseFloat(row.start_lng) : null,
    end_lat: row.end_lat ? parseFloat(row.end_lat) : null,
    end_lng: row.end_lng ? parseFloat(row.end_lng) : null,
    member_casual: row.member_casual?.trim() || null
    };
}

async function insertBatch(table, data) {
    // Uses the generic 'db' object which abstracts Supabase or Local PG
    const { error, code } = await db
        .from(table)
        .insert(data)

    if (error) {
        // Check if error is due to duplicate key (Postgres/Supabase code '23505')
        if (code === "23505") {
            return { error: true, isDuplicate: true }
        }
        console.error("Error inserting batch:", error)
        throw error
    }
}

async function importTrips(filepath) {
    console.log(`\nParsing ${filepath}...`)
    const trips = await parseCSV(filepath)
    console.log(`Found ${trips.length} trips`)

    let successCount = 0
    let errorCount = 0
    let skippedDuplicates = 0

    for (let i = 0; i < trips.length; i += BATCH_SIZE) {
        const batch = trips.slice(i, i + BATCH_SIZE)
            .map(transformTrip)
            .filter(trip => {
                // Filter out invalid rows
                if (!trip.ride_id || !trip.started_at || !trip.ended_at) {
                    errorCount++
                    return false
                }
                return true
            })

        try {
            await insertBatch("trips", batch)
            successCount += batch.length
            console.log(`✓ Inserted ${successCount}/${trips.length} trips (${errorCount} invalid, ${skippedDuplicates} duplicates)`)
        } catch (result) {
            if (result.isDuplicate) {
                skippedDuplicates += batch.length
                console.log(`⚠ Skipped ${batch.length} duplicate trips`)
            } else {
                console.error(`✗ Failed to insert batch at position ${i}:`, result.error.message)
                errorCount += batch.length
            }
        }
    }

    return { successCount, errorCount, skippedDuplicates, totalCount: trips.length }
}

async function extractStations() {
    console.log('\nExtracting unique stations from trips...');
    
    // Get all unique start stations
    // Uses generic 'db' object
    const { data: startStations, error: startError } = await db
        .from('trips')
        .select('start_station_id, start_station_name, start_lat, start_lng')
        .not('start_station_id', 'is', null);
    
    if (startError) throw startError;
    
    // Get all unique end stations
    const { data: endStations, error: endError } = await db
        .from('trips')
        .select('end_station_id, end_station_name, end_lat, end_lng')
        .not('end_station_id', 'is', null);
    
    if (endError) throw endError;
    
    // Create unique stations map (client-side logic remains the same)
    const stationsMap = new Map();
    
    startStations.forEach(trip => {
        if (trip.start_station_id && !stationsMap.has(trip.start_station_id)) {
        stationsMap.set(trip.start_station_id, {
            station_id: trip.start_station_id,
            name: trip.start_station_name,
            latitude: trip.start_lat,
            longitude: trip.start_lng
        });
        }
    });
    
    endStations.forEach(trip => {
        if (trip.end_station_id && !stationsMap.has(trip.end_station_id)) {
        stationsMap.set(trip.end_station_id, {
            station_id: trip.end_station_id,
            name: trip.end_station_name,
            latitude: trip.end_lat,
            longitude: trip.end_lng
        });
        }
    });
    
    const stations = Array.from(stationsMap.values());
    console.log(`Found ${stations.length} unique stations`);
    
    // Insert stations in batches (upsert is handled by the abstraction layer)
    let insertedCount = 0;
    for (let i = 0; i < stations.length; i += BATCH_SIZE) {
        const batch = stations.slice(i, i + BATCH_SIZE);
        
        // Uses generic 'db' object for upsert
        const { error } = await db
        .from('stations')
        .upsert(batch, { onConflict: 'station_id' });
        
        if (error) {
        console.error(`Error inserting stations batch:`, error);
        } else {
        insertedCount += batch.length;
        console.log(`✓ Inserted ${insertedCount}/${stations.length} stations`);
        }
    }
    return insertedCount;
}

async function getCSVFiles() {
    // Check if data folder exists
    if (!fs.existsSync(DATA_FOLDER)) {
        throw new Error(`Data folder not found: ${DATA_FOLDER}`)
    }

    // Get all CSV files in the data folder
    const files = fs.readdirSync(DATA_FOLDER)
        .filter(file => file.endsWith(".csv"))
        .map(file => path.join(DATA_FOLDER, file))
        .sort()
    
    if (files.length === 0) {
        throw new Error(`No CSV files found in ${DATA_FOLDER}`)
    } 

    return files
}

async function main() {
    try {
        const target = process.env.DB_TARGET || 'Local';
        console.log('═══════════════════════════════════════════════');
        console.log(`  Bay Wheels 2025 Data Import Tool (Target: ${target.toUpperCase()})`);
        console.log('═══════════════════════════════════════════════\n');

        // Get all CSV files
        const csvFiles = await getCSVFiles()
        console.log(`Found ${csvFiles.length} CSV files(s) to process:`)
        csvFiles.forEach(file => console.log(` - ${path.basename(file)}`))

        let totalTrips = 0
        let totalSuccess = 0
        let totalErrors = 0
        let totalDuplicates = 0

        for (const filepath of csvFiles) {
            const result = await importTrips(filepath)
            totalTrips += result.totalCount
            totalSuccess += result.successCount
            totalErrors += result.errorCount
            totalDuplicates += result.skippedDuplicates
        }

        console.log('\n───────────────────────────────────────────────')
        console.log('Trip Import Summary:')
        console.log(`  Total rows processed: ${totalTrips}`)
        console.log(`  Successfully imported: ${totalSuccess}`)
        console.log(`  Invalid/Skipped: ${totalErrors}`)
        console.log(`  Duplicates skipped: ${totalDuplicates}`)
        console.log('───────────────────────────────────────────────')

        // Extract and populate stations table
        const stationCount = await extractStations();
        
        console.log('\n═══════════════════════════════════════════════');
        console.log('  Import Complete! ✓');
        console.log(`  ${totalSuccess} trips imported`);
        console.log(`  ${stationCount} stations catalogued`);
        console.log('═══════════════════════════════════════════════\n');        
    } catch (error) {
        console.error('\n✗ Import failed:', error.message)
        process.exit(1)
    } finally {
        // Gracefully close the pool if the client exposes an 'end' method (Local PG, Direct Supabase PG)
        if (typeof db.end === "function") {
            await db.end()
        }
    }
}

// Run the import
await main()