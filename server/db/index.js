import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const DB_TARGET = process.env.DB_TARGET || "local";

const connectionString = DB_TARGET === "supabase" 
  ? process.env.SUPABASE_DB_URL 
  : process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: DB_TARGET === "supabase" ? { rejectUnauthorized: false } : false
});

const db = {
  // 1. Raw Query Methods
  query: (text, params) => pool.query(text, params),
  runSQL: (text, params) => pool.query(text, params),

  // 2. Resource-based Methods (Mirrors Supabase-style syntax)
  from: (table) => ({
    // Select helper
    select: (columns = "*") => ({
      limit: async (num) => {
        const res = await pool.query(`SELECT ${columns} FROM ${table} LIMIT $1`, [num]);
        return { data: res.rows, error: null };
      },
      then: async (resolve) => {
        try {
          const res = await pool.query(`SELECT ${columns} FROM ${table}`);
          resolve({ data: res.rows, error: null });
        } catch (err) {
          resolve({ data: null, error: err });
        }
      }
    }),

    // 3. Generic Upsert Helper (Logic extracted from your import scripts)
    upsert: async (records, options = {}) => {
      if (!records.length) return { data: [], error: null };

      const keys = Object.keys(records[0]);
      const onConflict = options.onConflict || keys[0]; // Usually 'station_id' or 'ride_id'
      
      // Build ($1, $2, $3), ($4, $5, $6)...
      const valuesPlaceholders = records.map((_, i) => 
        `(${keys.map((_, j) => `$${i * keys.length + j + 1}`).join(", ")})`
      ).join(", ");

      // Build SET col1 = EXCLUDED.col1, col2 = EXCLUDED.col2...
      const updateStr = keys
        .filter(key => key !== onConflict)
        .map(key => `${key} = EXCLUDED.${key}`)
        .join(", ");

      const sql = `
        INSERT INTO ${table} (${keys.join(", ")})
        VALUES ${valuesPlaceholders}
        ON CONFLICT (${onConflict}) DO UPDATE SET ${updateStr}
        RETURNING *;
      `;

      const params = records.flatMap(r => keys.map(k => r[k]));

      try {
        const res = await pool.query(sql, params);
        return { data: res.rows, error: null };
      } catch (err) {
        console.error(`Upsert error on ${table}:`, err.message);
        return { data: null, error: err };
      }
    }
  }),

  end: () => pool.end(),
};

export default db;