-- ============================
-- Reset existing tables
-- ============================

DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS stations;

-- ============================
-- Stations
-- ============================ 

CREATE TABLE IF NOT EXISTS stations (
  station_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude REAL,
  longitude REAL
);

-- ============================
-- Trips
-- ============================

CREATE TABLE IF NOT EXISTS trips (
  ride_id TEXT PRIMARY KEY,

  rideable_type TEXT NOT NULL,

  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NOT NULL,

  start_station_id TEXT,
  end_station_id TEXT,

  start_lat REAL,
  start_lng REAL,
  end_lat REAL,
  end_lng REAL,

  member_casual TEXT NOT NULL,

  duration_seconds REAL NOT NULL,

  FOREIGN KEY (start_station_id) REFERENCES stations(station_id),
  FOREIGN KEY (end_station_id) REFERENCES stations(station_id)
);
