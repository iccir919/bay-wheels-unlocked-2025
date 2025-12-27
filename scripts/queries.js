export const queries = {
  /* ============================
     OVERVIEW & KPIs
     ============================ */
  overview: `
    SELECT
      COUNT(DISTINCT ride_id) AS total_trips,
      (SELECT COUNT(*) FROM stations) AS unique_stations,
      MIN(started_at) AS earliest_trip,
      MAX(started_at) AS latest_trip,
      CAST(AVG(duration_seconds) AS INTEGER) AS avg_duration_seconds,
      CAST(AVG(duration_seconds) / 60 AS INTEGER) AS avg_duration_minutes,
      CAST(SUM(duration_seconds) / 3600.0 AS INTEGER) AS total_hours,
      COUNT(CASE WHEN member_casual = 'member' THEN 1 END) AS member_trips,
      COUNT(CASE WHEN member_casual = 'casual' THEN 1 END) AS casual_trips,
      COUNT(CASE WHEN rideable_type = 'electric_bike' THEN 1 END) AS electric_trips,
      COUNT(CASE WHEN rideable_type = 'classic_bike' THEN 1 END) AS classic_trips,
      COUNT(CASE WHEN start_station_id = end_station_id THEN 1 END) AS round_trips
    FROM trips;
  `,

  /* ============================
     STATION & ROUTE ANALYTICS (Using JOINs)
     ============================ */
  topStationsOverall: `
    SELECT
      s.name,
      s.latitude AS lat,
      s.longitude AS lng,
      COUNT(t.ride_id) AS departures,
      COUNT(CASE WHEN t.member_casual = 'member' THEN 1 END) AS member_starts,
      COUNT(CASE WHEN t.member_casual = 'casual' THEN 1 END) AS casual_starts
    FROM stations s
    JOIN trips t ON s.station_id = t.start_station_id
    GROUP BY s.station_id, s.name, s.latitude, s.longitude
    ORDER BY departures DESC
    LIMIT 50;
  `,

  topRoutes: `
    SELECT
      s1.name AS start_station,
      s2.name AS end_station,
      s1.latitude AS start_lat,
      s1.longitude AS start_lng,
      s2.latitude AS end_lat,
      s2.longitude AS end_lng,
      COUNT(*) AS trips,
      CAST(AVG(t.duration_seconds) / 60 AS INTEGER) AS avg_duration_minutes
    FROM trips t
    JOIN stations s1 ON t.start_station_id = s1.station_id
    JOIN stations s2 ON t.end_station_id = s2.station_id
    WHERE t.start_station_id <> t.end_station_id
    GROUP BY s1.name, s2.name, s1.latitude, s1.longitude, s2.latitude, s2.longitude
    ORDER BY trips DESC
    LIMIT 100;
  `,

  /* ============================
     TEMPORAL PATTERNS
     ============================ */
  tripsByHour: `
    SELECT
      CAST(EXTRACT(HOUR FROM started_at) AS INTEGER) AS hour,
      member_casual,
      COUNT(*) AS trips,
      CAST(AVG(duration_seconds) / 60 AS INTEGER) AS avg_duration_minutes
    FROM trips
    GROUP BY hour, member_casual
    ORDER BY hour;
  `,

  tripsByDayOfWeek: `
    SELECT
      CAST(EXTRACT(DOW FROM started_at) AS INTEGER) AS day_index,
      CASE 
        WHEN EXTRACT(DOW FROM started_at) = 0 THEN 'Sunday'
        WHEN EXTRACT(DOW FROM started_at) = 1 THEN 'Monday'
        WHEN EXTRACT(DOW FROM started_at) = 2 THEN 'Tuesday'
        WHEN EXTRACT(DOW FROM started_at) = 3 THEN 'Wednesday'
        WHEN EXTRACT(DOW FROM started_at) = 4 THEN 'Thursday'
        WHEN EXTRACT(DOW FROM started_at) = 5 THEN 'Friday'
        WHEN EXTRACT(DOW FROM started_at) = 6 THEN 'Saturday'
      END AS day_name,
      COUNT(*) AS trips
    FROM trips
    GROUP BY day_index, day_name
    ORDER BY day_index;
  `,

tripsByMonth: `
    SELECT 
      TO_CHAR(started_at, 'Mon') AS month_name,
      EXTRACT(MONTH FROM started_at) AS month_index,
      COUNT(*) AS trips
    FROM trips
    GROUP BY month_name, month_index
    ORDER BY month_index;
  `,

  busiestDays: `
    SELECT 
      TO_CHAR(started_at, 'YYYY-MM-DD') AS date,
      COUNT(*) AS trips
    FROM trips
    GROUP BY date
    ORDER BY trips DESC
    LIMIT 10;
  `,

  /* ============================
     GEOSPATIAL DISTANCE
     ============================ */
  tripDistanceDistribution: `
    SELECT
      CASE
        WHEN distance_km < 1 THEN '0-1 km'
        WHEN distance_km < 2 THEN '1-2 km'
        WHEN distance_km < 3 THEN '2-3 km'
        WHEN distance_km < 5 THEN '3-5 km'
        ELSE '5+ km'
      END AS distance_bucket,
      member_casual,
      COUNT(*) AS trips
    FROM (
      SELECT 
        member_casual,
        (6371 * acos(LEAST(1.0, cos(radians(start_lat)) * cos(radians(end_lat)) * cos(radians(end_lng) - radians(start_lng)) + sin(radians(start_lat)) * sin(radians(end_lat))))) AS distance_km
      FROM trips
      WHERE start_lat IS NOT NULL AND end_lat IS NOT NULL AND start_lat <> 0
    ) sub
    WHERE distance_km < 50
    GROUP BY 1, 2 ORDER BY 1;
  `,

  /* ============================
     BEHAVIORAL SEGMENTS
     ============================ */
  durationDistribution: `
    SELECT
      CASE
        WHEN duration_seconds < 300 THEN '0-5 min'
        WHEN duration_seconds < 600 THEN '5-10 min'
        WHEN duration_seconds < 1200 THEN '10-20 min'
        WHEN duration_seconds < 1800 THEN '20-30 min'
        ELSE '30+ min'
      END AS duration_bucket,
      member_casual,
      COUNT(*) AS trips
    FROM trips
    GROUP BY 1, 2 ORDER BY 1;
  `,

  morningRushHeatmap: `
    SELECT
      ROUND(CAST(start_lat AS NUMERIC), 3) AS lat,
      ROUND(CAST(start_lng AS NUMERIC), 3) AS lng,
      COUNT(*) AS trips
    FROM trips
    WHERE EXTRACT(HOUR FROM started_at) BETWEEN 7 AND 9
    GROUP BY 1, 2 HAVING COUNT(*) > 5;
  `,

  unusuallyLongTrips: `
    SELECT
      t.ride_id,
      CAST(t.duration_seconds / 3600.0 AS DECIMAL(10,2)) AS duration_hours,
      s1.name AS start_station,
      s2.name AS end_station
    FROM trips t
    LEFT JOIN stations s1 ON t.start_station_id = s1.station_id
    LEFT JOIN stations s2 ON t.end_station_id = s2.station_id
    WHERE t.duration_seconds > 7200
    ORDER BY duration_hours DESC LIMIT 50;
  `
};