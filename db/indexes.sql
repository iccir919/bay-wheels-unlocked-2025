-- Standard Indexes for filtering and sorting
CREATE INDEX idx_trips_started_at ON trips(started_at);
CREATE INDEX idx_trips_member_casual ON trips(member_casual);

-- Functional Index for the Hour Analysis
CREATE INDEX idx_trips_hour ON trips (EXTRACT(HOUR FROM started_at));

-- Geospatial Index
CREATE INDEX idx_trips_coords ON trips(start_lat, start_lng);