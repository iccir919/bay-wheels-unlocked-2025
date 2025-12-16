import express from "express"
import dotenv from "dotenv"
import compression from "compression"
import helmet from "helmet"
import cors from "cors"
import db from "../db/index.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(compression())
app.use(cors({
    origin: "*"
}))
app.use(express.json())

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
    next()
})

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "bay-wheels-unlocked-2025-api"
    })
})

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found"})
})

// Error handler
app.use((err, req, res, next) => {
    console.error("Error:", err)
    res.status(err.status || 500).json({
        error: err.message || "Internal server error"
    })
})

async function startServer() {
    try {
        const dbTarget = process.env.DB_TARGET || "local"
        console.log(`Database target: ${dbTarget.toUpperCase()}`);

        try {
            const { error } = await db.query("SELECT 1")
            if (error) throw error
            console.log("✓ Database connection successful")
        } catch (error) {
            console.error("✗ Database connection failed:", error.message)
            console.log("Make sure to run: npm run db:init")
            process.exit(1)
        }

        app.listen(PORT, () => {
        console.log('═══════════════════════════════════════════════');
        console.log(`  Bay Wheels Analytics API`);
        console.log(`  Server running on port ${PORT}`);
        console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('═══════════════════════════════════════════════\n');
        console.log(`  Health check: http://localhost:${PORT}/health`);
        console.log(`  API Base URL: http://localhost:${PORT}/api`);
        console.log('');
        });
    } catch(error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer()