// Sets up the database schema (tables, indices) for the configured DB_TARGET.
// This script EXECUTES the SQL for BOTH Supabase and Local PostgreSQL.
// Run: node scripts/init-schema.js or DB_TARGET=local node scripts/init-schema.js

import db from "../db/index.js"

// PostgreSQL Schema Definition (works for both Supabase and Local PG)
const SCHEMA_SQL = `
-- Drop tables if they exist (for a clean setup)
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS stations CASCADE;

-- Table for Unique Station Data
CREATE TABLE stations (
    station_id TEXT PRIMARY KEY,
    name TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Bike Trip Data
CREATE TABLE trips (
    ride_id TEXT PRIMARY KEY,
    rideable_type TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
    start_station_name TEXT,
    start_station_id TEXT REFERENCES stations(station_id),
    end_station_name TEXT,
    end_station_id TEXT REFERENCES stations(station_id),
    start_lat DOUBLE PRECISION,
    start_lng DOUBLE PRECISION,
    end_lat DOUBLE PRECISION,
    end_lng DOUBLE PRECISION,
    member_casual TEXT
);

-- Index for faster filtering and joins
CREATE INDEX idx_trips_start_station_id ON trips (start_station_id);
CREATE INDEX idx_trips_end_station_id ON trips (end_station_id);
CREATE INDEX idx_trips_started_at ON trips (started_at);
`;

async function initSchema() {
    const target = process.env.DB_TARGET || 'supabase';
    
    console.log('====================================================');
    console.log(`        Executing Schema Initialization for Target: ${target.toUpperCase()}`);
    console.log('====================================================');
    
    if (typeof db.runSQL !== 'function') {
        console.error('\n✗ ERROR: The selected database client did not expose a runSQL method for schema initialization.');
        process.exit(1);
    }

    // This single block now handles both Supabase and Local PostgreSQL
    const { error } = await db.runSQL(SCHEMA_SQL);

    if (error) {
        console.error(`\n✗ Schema Initialization Failed for ${target.toUpperCase()}:`, error.message);
        process.exit(1);
    } else {
        console.log(`\n✓ ${target.toUpperCase()} Schema initialized successfully!`);
    }

    // Close the connection pool if the method exists
    if (typeof db.end === 'function') {
        await db.end();
    }
    
    console.log('====================================================');
    console.log('Setup complete. Run: node scripts/import-data.js');
}

initSchema();