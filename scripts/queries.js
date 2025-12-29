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
     STATION & ROUTE ANALYTICS 
     ============================ */
  stations: `
    SELECT
      s.station_id,
      s.name,
      s.latitude,
      s.longitude,

      COUNT(t.ride_id) AS total_trips,

      SUM(CASE WHEN t.member_casual = 'member' THEN 1 ELSE 0 END) AS member_trips,
      SUM(CASE WHEN t.member_casual = 'casual' THEN 1 ELSE 0 END) AS casual_trips,

      SUM(CASE WHEN t.start_station_id = t.end_station_id THEN 1 ELSE 0 END) AS round_trips

    FROM stations s
    LEFT JOIN trips t
      ON s.station_id = t.start_station_id
      OR s.station_id = t.end_station_id

    WHERE
      s.name IS NOT NULL
      AND s.latitude IS NOT NULL
      AND s.longitude IS NOT NULL

    GROUP BY
      s.station_id, s.name, s.latitude, s.longitude

    ORDER BY
      total_trips DESC
  `,

  topDestinationsPerStation: `
    SELECT
      start_station_id,
      end_station_id,
      COUNT(*) AS trip_count
    FROM trips
    WHERE start_station_id != end_station_id
    GROUP BY start_station_id, end_station_id
    ORDER BY start_station_id, trip_count DESC
  `,

  commonRoutes: `
    SELECT
      -- Create the canonical "Station A" and "Station B"
      CASE WHEN t.start_station_id < t.end_station_id THEN t.start_station_id ELSE t.end_station_id END AS s1_id,
      CASE WHEN t.start_station_id < t.end_station_id THEN s1.name ELSE s2.name END AS s1_name,

      CASE WHEN t.start_station_id < t.end_station_id THEN t.end_station_id ELSE t.start_station_id END AS s2_id,
      CASE WHEN t.start_station_id < t.end_station_id THEN s2.name ELSE s1.name END AS s2_name,

      -- Use fixed station coordinates for visualization
      CASE WHEN t.start_station_id < t.end_station_id THEN s1.latitude ELSE s2.latitude END AS s1_lat,
      CASE WHEN t.start_station_id < t.end_station_id THEN s1.longitude ELSE s2.longitude END AS s1_lng,
      CASE WHEN t.start_station_id < t.end_station_id THEN s2.latitude ELSE s1.latitude END AS s2_lat,
      CASE WHEN t.start_station_id < t.end_station_id THEN s2.longitude ELSE s1.longitude END AS s2_lng,

      -- Aggregated Metrics
      COUNT(*) AS total_trips,
      SUM(CASE WHEN t.member_casual = 'member' THEN 1 ELSE 0 END) AS member_trips,
      SUM(CASE WHEN t.member_casual = 'casual' THEN 1 ELSE 0 END) AS casual_trips,
      AVG(t.duration_seconds) / 60.0 AS avg_duration_minutes

    FROM trips t
    JOIN stations s1 ON t.start_station_id = s1.station_id
    JOIN stations s2 ON t.end_station_id = s2.station_id
    WHERE t.start_station_id IS NOT NULL 
      AND t.end_station_id IS NOT NULL 
      AND t.start_station_id != t.end_station_id

    GROUP BY 1, 2, 3, 4, 5, 6, 7, 8
    ORDER BY total_trips DESC
    LIMIT 1000;
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
    WHERE EXTRACT(YEAR FROM started_at) = 2025
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
  `
};