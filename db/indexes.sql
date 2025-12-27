-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trips_started_at ON trips(started_at);
CREATE INDEX IF NOT EXISTS idx_trips_ended_at ON trips(ended_at);
CREATE INDEX IF NOT EXISTS idx_trips_start_station ON trips(start_station_id);
CREATE INDEX IF NOT EXISTS idx_trips_end_station ON trips(end_station_id);
CREATE INDEX IF NOT EXISTS idx_trips_member_casual ON trips(member_casual);
CREATE INDEX IF NOT EXISTS idx_trips_rideable_type ON trips(rideable_type);