import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config()

const POSTGRES_CONNECTION_STRING = process.env.LOCAL_POSTGRES_URL || "postgres://localhost:5432/baywheels_2025_local"

const pgPool = new Pool({
    connectionString: POSTGRES_CONNECTION_STRING
})

export function createLocalClient() {
    console.log(`[LocalClient] Connecting to PostgreSQL at: ${POSTGRES_CONNECTION_STRING.split('@').pop()}`);

    return {
        // --- Low-Level DDL/Schema Method (for init-schema.js) ---
        async runSQL(sql) {
            const client = await pgPool.connect();
            try {
                console.log('[LocalClient] Executing DDL/Schema SQL...');
                await client.query(sql);
                return { error: null };
            } catch (error) {
                console.error(`[LocalClient] Error running schema SQL: ${error.message}`);
                return { error };
            } finally {
                client.release();
            }
        },

        // --- Data Interaction Methods (mimicking Supabase for import-data.js) ---
        from: (table) => ({
            async insert(data) {
                if (data.length === 0) return { error: null };
                

                const columns = Object.keys(data[0]).map(col => `"${col}"`).join(', ');
                let values = [];
                let placeholders = [];
                let paramIndex = 1;

                for (const row of data) {
                    const rowValues = Object.values(row);
                    values.push(...rowValues);
                    
                    const rowPlaceholders = rowValues.map(() => `$${paramIndex++}`).join(', ');
                    placeholders.push(`(${rowPlaceholders})`);
                }
                
                // Use ON CONFLICT DO NOTHING to handle duplicates gracefully
                const sql = `INSERT INTO "${table}" (${columns}) VALUES ${placeholders.join(', ')} ON CONFLICT (ride_id) DO NOTHING;`;

                try {
                    await pgPool.query(sql, values);
                    return { error: null };
                } catch (error) {
                    // Explicitly check for unique violation code (Postgres '23505')
                    if (error.code === '23505') {
                        return { error, code: '23505' };
                    }
                    console.error(`[LocalClient] Error inserting batch:`, error.message);
                    return { error };
                }
            },

            select: (columns) => ({
                not: async (column, operator, value) => {
                    const columnsSQL = columns.split(',').map(c => `"${c.trim()}"`).join(', ');
                    const sql = `SELECT ${columnsSQL} FROM "${table}" WHERE "${column}" IS NOT NULL;`;
                    
                    try {
                        const res = await pgPool.query(sql);
                        return { data: res.rows, error: null };
                    } catch (error) {
                        console.error(`[LocalClient] Error selecting data:`, error.message);
                        return { data: null, error };
                    }
                }
            }),

            async upsert(data, { onConflict }) {
                if (data.length === 0) return { error: null };
                

                const columns = Object.keys(data[0]).map(col => `"${col}"`).join(', ');
                const conflictColumn = onConflict;
                
                const updateColumns = Object.keys(data[0])
                    .filter(key => key !== conflictColumn)
                    .map(key => `"${key}" = EXCLUDED."${key}"`)
                    .join(', ');

                let values = [];
                let placeholders = [];
                let paramIndex = 1;

                for (const row of data) {
                    const rowValues = Object.values(row);
                    values.push(...rowValues);
                    
                    const rowPlaceholders = rowValues.map(() => `$${paramIndex++}`).join(', ');
                    placeholders.push(`(${rowPlaceholders})`);
                }

                const sql = `
                    INSERT INTO "${table}" (${columns}) 
                    VALUES ${placeholders.join(', ')} 
                    ON CONFLICT ("${conflictColumn}") 
                    DO UPDATE SET ${updateColumns};
                `;
                
                try {
                    await pgPool.query(sql, values);
                    return { error: null };
                } catch (error) {
                    console.error(`[LocalClient] Error upserting batch:`, error.message);
                    return { error };
                }
            }
        }),
        
        async end() {
            await pgPool.end();
            console.log('[LocalClient] Connection pool closed.');
        }
    };
}