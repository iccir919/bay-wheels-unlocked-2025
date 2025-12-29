-- Standard Indexes for filtering and sorting
CREATE INDEX idx_trips_started_at ON trips(started_at);
CREATE INDEX idx_trips_member_casual ON trips(member_casual);

-- Functional Index for the Hour Analysis
CREATE INDEX idx_trips_hour ON trips (EXTRACT(HOUR FROM started_at));

-- Indexes for faster station-based queries
CREATE INDEX idx_trips_start_station ON trips(start_station_id);
CREATE INDEX idx_trips_end_station   ON trips(end_station_id);
CREATE INDEX idx_trips_station_pairing ON trips(start_station_id, end_station_id);

-- Geospatial Index
CREATE INDEX idx_trips_coords ON trips(start_lat, start_lng);