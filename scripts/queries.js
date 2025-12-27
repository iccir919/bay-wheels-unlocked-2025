export const queries = {
  /* ============================
     1. Peak Hours
     ============================ */

  tripsByHour: `
    SELECT
      CAST(SUBSTR(started_at, 12, 2) AS INTEGER) AS hour,
      member_casual,
      COUNT(*) AS trips
    FROM trips
    GROUP BY hour, member_casual
    ORDER BY hour;
  `,

  tripsByMonth: `
    SELECT
      SUBSTR(started_at, 1, 7) AS month,
      COUNT(*) AS trips
    FROM trips
    GROUP BY month
    ORDER BY month;
  `,

  /* ============================
     2. Route Analytics
     ============================ */

  topRoutes: `
    SELECT
      start_station_id,
      end_station_id,
      COUNT(*) AS trips,
      AVG(duration_seconds) AS avg_duration_seconds
    FROM trips
    WHERE
      start_station_id IS NOT NULL
      AND end_station_id IS NOT NULL
      AND start_station_id <> end_station_id
    GROUP BY start_station_id, end_station_id
    ORDER BY trips DESC
    LIMIT 50;
  `,

  /* ============================
     3. Station Popularity
     ============================ */

  topStartStations: `
    SELECT
      start_station_id AS station_id,
      COUNT(*) AS trips
    FROM trips
    WHERE start_station_id IS NOT NULL
    GROUP BY start_station_id
    ORDER BY trips DESC
    LIMIT 20;
  `,

  /* ============================
     4. Heatmaps
     ============================ */

  startStationHeatmap: `
    SELECT
      start_lat AS lat,
      start_lng AS lng,
      COUNT(*) AS trips
    FROM trips
    WHERE start_lat IS NOT NULL
      AND start_lng IS NOT NULL
    GROUP BY start_lat, start_lng;
  `,

  morningPeakHeatmap: `
    SELECT
      start_lat AS lat,
      start_lng AS lng,
      COUNT(*) AS trips
    FROM trips
    WHERE
      start_lat IS NOT NULL
      AND start_lng IS NOT NULL
      AND CAST(SUBSTR(started_at, 12, 2) AS INTEGER) BETWEEN 7 AND 10
    GROUP BY start_lat, start_lng;
  `,

  eveningPeakHeatmap: `
    SELECT
      start_lat AS lat,
      start_lng AS lng,
      COUNT(*) AS trips
    FROM trips
    WHERE
      start_lat IS NOT NULL
      AND start_lng IS NOT NULL
      AND CAST(SUBSTR(started_at, 12, 2) AS INTEGER) BETWEEN 16 AND 19
    GROUP BY start_lat, start_lng;
  `,

  /* ============================
     5. Rider Behavior
     ============================ */

  memberVsCasualSummary: `
    SELECT
      member_casual,
      COUNT(*) AS trips,
      AVG(duration_seconds) AS avg_duration_seconds
    FROM trips
    GROUP BY member_casual;
  `
};
