// Sets up the database schema (tables, indices) for the configured DB_TARGET.
// This script EXECUTES the SQL for BOTH Supabase and Local PostgreSQL.
// Run: node scripts/init-schema.js or DB_TARGET=local node scripts/init-schema.js

import db from "../db/index.js"

// PostgreSQL Schema Definition (works for both Supabase and Local PG)
const SCHEMA_SQL = `
-- ============================================
-- DROP EXISTING TABLES (Clean Slate)
-- ============================================
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS stations CASCADE;

-- ============================================
-- TABLES
-- ============================================

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
  station_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trips table (Core data for 2025)
CREATE TABLE IF NOT EXISTS trips (
  trip_id BIGSERIAL PRIMARY KEY,
  ride_id TEXT UNIQUE NOT NULL,
  rideable_type TEXT,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NOT NULL,
  duration_seconds INT,
  start_station_name TEXT,
  start_station_id TEXT REFERENCES stations(station_id) ON DELETE SET NULL, 
  end_station_name TEXT,
  end_station_id TEXT REFERENCES stations(station_id) ON DELETE SET NULL, 
  start_lat DOUBLE PRECISION,
  start_lng DOUBLE PRECISION,
  end_lat DOUBLE PRECISION,
  end_lng DOUBLE PRECISION,
  member_casual TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Time-based indexes
CREATE INDEX IF NOT EXISTS idx_trips_started_at ON trips(started_at);
CREATE INDEX IF NOT EXISTS idx_trips_ended_at ON trips(ended_at);

-- Simple DATE_TRUNC without timezone conversion is IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_trips_started_at_month 
ON trips (DATE_TRUNC('month', started_at));

-- Station and Relationship indexes
CREATE INDEX IF NOT EXISTS idx_trips_start_station ON trips(start_station_id);
CREATE INDEX IF NOT EXISTS idx_trips_end_station ON trips(end_station_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_end_stations ON trips(start_station_id, end_station_id);

-- Filter/Facet indexes
CREATE INDEX IF NOT EXISTS idx_trips_member_casual ON trips(member_casual);
CREATE INDEX IF NOT EXISTS idx_trips_rideable_type ON trips(rideable_type);


-- ============================================
-- FUNCTIONS
-- ============================================

-- 1. Format duration into HH:MI:SS
CREATE OR REPLACE FUNCTION format_duration(seconds_input INT)
RETURNS TEXT AS $$
SELECT
    CASE 
        WHEN seconds_input IS NULL OR seconds_input < 0 THEN '00:00:00'
        ELSE 
            TO_CHAR((seconds_input / 3600), 'FM00') || ':' ||
            TO_CHAR(((seconds_input % 3600) / 60), 'FM00') || ':' ||
            TO_CHAR((seconds_input % 60), 'FM00')
    END;
$$ LANGUAGE SQL IMMUTABLE;

-- 2. Haversine distance calculation
CREATE OR REPLACE FUNCTION haversine_distance(
    lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION,
    units TEXT DEFAULT 'miles'
)
RETURNS NUMERIC AS $$
DECLARE
    r NUMERIC;
    phi1 NUMERIC;
    phi2 NUMERIC;
    d_phi NUMERIC;
    d_lambda NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;

    r := CASE WHEN units = 'km' THEN 6371.0 ELSE 3958.8 END;
    phi1 := RADIANS(lat1);
    phi2 := RADIANS(lat2);
    d_phi := RADIANS(lat2 - lat1);
    d_lambda := RADIANS(lon2 - lon1);
    a := SIN(d_phi / 2) * SIN(d_phi / 2) + COS(phi1) * COS(phi2) * SIN(d_lambda / 2) * SIN(d_lambda / 2);
    c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
    RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Categorization logic
CREATE OR REPLACE FUNCTION categorize_trip_duration(duration_seconds INT)
RETURNS TEXT AS $$
BEGIN
    IF duration_seconds <= 600 THEN RETURN '0-10 Min (Short)';
    ELSIF duration_seconds <= 1800 THEN RETURN '10-30 Min (Medium)';
    ELSIF duration_seconds <= 3600 THEN RETURN '30-60 Min (Long)';
    ELSE RETURN '> 60 Min (Extended)';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ============================================
-- VIEWS
-- ============================================

-- V1. Monthly Summary 
CREATE OR REPLACE VIEW trips_monthly_summary_2025 AS
SELECT
    TO_CHAR(DATE_TRUNC('month', started_at), 'YYYY-MM') AS month_year,
    DATE_TRUNC('month', started_at) AS month,
    COUNT(*) AS total_trips,
    
    -- Duration metrics
    AVG(duration_seconds) AS avg_duration_seconds,
    ROUND((AVG(duration_seconds) / 60.0)::NUMERIC, 2) AS avg_duration_minutes,
    format_duration(CAST(AVG(duration_seconds) AS INT)) AS avg_duration_formatted,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_seconds) AS median_duration_seconds,
    
    -- Distance metrics IN MILES
    ROUND(
        SUM(haversine_distance(start_lat, start_lng, end_lat, end_lng, 'miles')), 
        2
    ) AS total_distance_miles,
    ROUND(
        AVG(haversine_distance(start_lat, start_lng, end_lat, end_lng, 'miles')), 
        2
    ) AS avg_distance_miles,
    
    -- User type breakdown
    COUNT(*) FILTER (WHERE member_casual = 'member') AS member_trips,
    COUNT(*) FILTER (WHERE member_casual = 'casual') AS casual_trips,
    ROUND(
        (100.0 * COUNT(*) FILTER (WHERE member_casual = 'member') / COUNT(*))::NUMERIC, 
        1
    ) AS member_percentage,
    
    -- Station metrics
    COUNT(DISTINCT start_station_id) AS unique_start_stations,
    COUNT(DISTINCT end_station_id) AS unique_end_stations
FROM trips
GROUP BY 1, 2
ORDER BY month;

-- V2. Yearly Summary 
CREATE OR REPLACE VIEW trips_yearly_summary_2025 AS
SELECT
    EXTRACT(YEAR FROM started_at) AS year,
    COUNT(*) AS total_trips,
    
    -- Duration metrics
    ROUND((AVG(duration_seconds) / 60.0)::NUMERIC, 2) AS avg_duration_minutes,
    format_duration(CAST(AVG(duration_seconds) AS INT)) AS avg_duration_formatted,
    ROUND(
        (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_seconds) / 60.0)::NUMERIC, 
        2
    ) AS median_duration_minutes,
    
    -- Distance metrics IN MILES
    ROUND(
        SUM(haversine_distance(start_lat, start_lng, end_lat, end_lng, 'miles')), 
        2
    ) AS total_distance_miles,
    ROUND(
        AVG(haversine_distance(start_lat, start_lng, end_lat, end_lng, 'miles')), 
        2
    ) AS avg_distance_miles,
    
    -- User type breakdown
    COUNT(*) FILTER (WHERE member_casual = 'member') AS member_trips,
    COUNT(*) FILTER (WHERE member_casual = 'casual') AS casual_trips,
    ROUND(
        (100.0 * COUNT(*) FILTER (WHERE member_casual = 'member') / COUNT(*))::NUMERIC, 
        1
    ) AS member_percentage,
    
    -- Station metrics
    (
        SELECT COUNT(DISTINCT station_id) 
        FROM (
            SELECT DISTINCT start_station_id AS station_id FROM trips WHERE EXTRACT(YEAR FROM started_at) = 2025
            UNION
            SELECT DISTINCT end_station_id AS station_id FROM trips WHERE EXTRACT(YEAR FROM started_at) = 2025
        ) AS all_stations
        WHERE station_id IS NOT NULL
    ) AS unique_stations,
    
    -- Rideable type breakdown
    COUNT(*) FILTER (WHERE rideable_type = 'electric_bike') AS electric_bike_trips,
    COUNT(*) FILTER (WHERE rideable_type = 'classic_bike') AS classic_bike_trips,
    COUNT(*) FILTER (WHERE rideable_type = 'docked_bike') AS docked_bike_trips
FROM trips
WHERE EXTRACT(YEAR FROM started_at) = 2025
GROUP BY 1;


-- V3. Route Detail 
CREATE OR REPLACE VIEW route_detail_2025 AS
SELECT
    start_station_name,
    end_station_name,
    start_station_id,
    end_station_id,
    COUNT(ride_id) AS trips_on_route,
    
    -- Duration metrics
    AVG(duration_seconds) AS avg_duration_seconds,
    ROUND((AVG(duration_seconds) / 60.0)::NUMERIC, 2) AS avg_duration_minutes,
    
    -- Distance metrics (both miles and km for flexibility)
    ROUND(
        AVG(haversine_distance(start_lat, start_lng, end_lat, end_lng, 'miles')), 
        2
    ) AS avg_distance_miles,
    ROUND(
        AVG(haversine_distance(start_lat, start_lng, end_lat, end_lng, 'km')), 
        2
    ) AS avg_distance_km,
    
    -- User type on this route
    COUNT(*) FILTER (WHERE member_casual = 'member') AS member_trips,
    COUNT(*) FILTER (WHERE member_casual = 'casual') AS casual_trips,
    
    -- Most common bike type on this route
    MODE() WITHIN GROUP (ORDER BY rideable_type) AS most_common_bike_type
FROM trips
WHERE start_station_id IS NOT NULL AND end_station_id IS NOT NULL
GROUP BY 1, 2, 3, 4
HAVING COUNT(ride_id) > 5
ORDER BY trips_on_route DESC;


-- V4. Trip Category Distribution 
CREATE OR REPLACE VIEW trips_category_distribution_2025 AS
SELECT
    categorize_trip_duration(duration_seconds) AS duration_category,
    member_casual,
    COUNT(ride_id) AS trip_count,
    
    -- Additional metrics per category
    ROUND((AVG(duration_seconds) / 60.0)::NUMERIC, 2) AS avg_duration_minutes,
    ROUND(
        AVG(haversine_distance(start_lat, start_lng, end_lat, end_lng, 'miles')), 
        2
    ) AS avg_distance_miles,
    
    -- Percentage of total trips
    ROUND(
        (100.0 * COUNT(ride_id) / SUM(COUNT(ride_id)) OVER ())::NUMERIC, 
        2
    ) AS percentage_of_total
FROM trips
GROUP BY 1, 2
ORDER BY 
    CASE categorize_trip_duration(duration_seconds)
        WHEN '0-10 Min (Short)' THEN 1
        WHEN '10-30 Min (Medium)' THEN 2
        WHEN '30-60 Min (Long)' THEN 3
        WHEN '> 60 Min (Extended)' THEN 4
    END,
    member_casual;
`

async function initSchema() {
    const target = process.env.DB_TARGET || 'local'
    
    console.log('====================================================')
    console.log(`        Executing Schema Initialization for Target: ${target.toUpperCase()}`)
    console.log('====================================================')
    
    if (typeof db.runSQL !== 'function') {
        console.error('\n✗ ERROR: The selected database client did not expose a runSQL method for schema initialization.')
        process.exit(1)
    }

    const { error } = await db.runSQL(SCHEMA_SQL);

    if (error) {
        console.error(`\n✗ Schema Initialization Failed for ${target.toUpperCase()}:`, error.message)
        process.exit(1)
    } else {
        console.log(`\n✓ ${target.toUpperCase()} Schema initialized successfully!`)
    }

    // Close the connection pool if the method exists
    if (typeof db.end === 'function') {
        await db.end()
    }
    
    console.log('====================================================')
    console.log('Setup complete. Run: node scripts/import-data.js')
}

initSchema();