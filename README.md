# Bay Wheels Unlocked 2025 📊🚴

A full-stack analytics dashboard for Bay Wheels bike share data, featuring trip analysis, station insights, and usage patterns from January to October 2025.

## Project Overview

This application provides comprehensive analytics for the Bay Wheels bike share system, including:

- **Real-time trip statistics** and usage trends
- **Station activity analysis** with top destinations
- **Route popularity** and distance metrics
- **Time-based patterns** (hourly and daily usage)
- **Rider segmentation** (members vs. casual riders)
- **Bike type comparison** (electric vs. classic bikes)

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for data storage
- **Supabase** or local PostgreSQL support
- Custom database abstraction layer

### Frontend
- **React** with Vite
- **Recharts** for data visualization
- **TailwindCSS** for styling

## Project Structure

```
project/
├── server/
│   ├── db/
│   │   ├── index.js              # Database connection & query abstraction
│   │   ├── init-schema.js        # Schema migrations (tables, views, indexes)
│   │   └── import-data.js        # CSV data import scripts
│   ├── src/
│   │   ├── server.js             # Express server setup
│   │   ├── routes/
│   │   │   └── analyticsRoutes.js    # API route definitions
│   │   └── controllers/
│   │       └── analyticsController.js # Request handlers
│   ├── .env                      # Environment configuration
│   └── package.json              # Backend dependencies
├── client/
│   ├── src/
│   │   └── App.jsx               # React dashboard UI
│   ├── index.html
│   ├── vite.config.js
│   └── package.json              # Frontend dependencies
└── README.md
```

## Database Schema

### Tables
- **stations**: Station metadata (ID, name, coordinates)
- **trips**: Individual trip records with timestamps, duration, rider type, bike type

### Views
- `station_activity_summary`: Aggregated station metrics
- `route_detail_2025`: Popular routes with distance and duration
- `trips_monthly_summary`: Monthly trip volume and averages
- `hourly_usage_pattern`: Usage by hour of day
- `daily_usage_pattern`: Usage by day of week
- `bike_type_performance`: Electric vs. classic bike metrics

### Functions
- `haversine_distance()`: Calculate distance between coordinates in miles

## Setup Instructions

### Prerequisites
- Node.js 16+
- PostgreSQL 13+ or Supabase account
- CSV data files (trips and stations)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd bay-wheels-analytics
```

2. **Install backend dependencies**
```bash
cd server
npm install
```

3. **Install frontend dependencies**
```bash
cd ../client
npm install
```

3. **Configure environment variables**

Create a `.env` file in the `server/` directory:

```env
# Database Target
DB_TARGET=local          # or 'supabase'

# Local PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/baywheels

# Supabase (if using)
SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Server
PORT=5000
```

Create a `.env` file in the `client/` directory (or use `.env.local`):

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

4. **Initialize the database**
```bash
cd server
node db/init-schema.js
```

5. **Import data**
```bash
node db/import-data.js
```

6. **Start the backend server**
```bash
# From server/ directory
npm run dev
# or
node src/server.js
```

7. **Start the frontend** (in a separate terminal)
```bash
# From client/ directory
npm run dev
```

The dashboard will be available at `http://localhost:5173` (Vite default port)

## Database Schema

### Station Endpoints
- `GET /api/stations` - Get all stations (default limit: 50)
- `GET /api/stations/top?limit=10&orderBy=total_activity` - Get top stations
- `GET /api/stations/:stationId` - Get specific station details

### Route Endpoints
- `GET /api/routes/top?limit=20&minTrips=10` - Get most popular routes
- `GET /api/routes/map-data?minTrips=50&limit=100` - Get route data for mapping

### Summary Endpoints
- `GET /api/summary/overview` - Overall system statistics
- `GET /api/summary/monthly` - Monthly trip summaries
- `GET /api/summary/rider-types` - Member vs. casual breakdown

### Pattern Endpoints
- `GET /api/patterns/hourly` - Usage by hour of day
- `GET /api/patterns/daily` - Usage by day of week

### Bike Type Endpoints
- `GET /api/bikes/performance` - Electric vs. classic comparison

### Trip Search
- `GET /api/trips/search?startStation=123&riderType=member&limit=100` - Filtered trip search

## Key Features

### Dashboard Highlights

1. **Hero Statistics**
   - Total trips across the system
   - Number of active stations
   - Average trip duration
   - Member usage percentage

2. **Monthly Trends**
   - Line chart showing trip volume over time
   - Tracks growth and seasonality

3. **Hourly Usage Patterns**
   - Bar chart comparing member vs. casual usage by hour
   - Identifies commute peaks and leisure hours

4. **Top Routes**
   - Lists most popular origin-destination pairs
   - Shows distance, duration, and rider breakdown
   - Highlights round trips

5. **Top Stations**
   - Ranks stations by total activity
   - Shows trip starts and member percentages

6. **Rider & Bike Breakdowns**
   - Visual comparison of member vs. casual riders
   - Electric vs. classic bike usage statistics

## Database Query Optimization

The schema includes strategic indexes for common query patterns:
- `idx_trips_start_station_time` - Station + time-based queries
- `idx_trips_member_started_at` - Member analysis
- `idx_trips_rideable_type` - Bike type filtering
- `idx_trips_started_at` - Time-based aggregations

## Data Import

The `import-data.js` script handles:
- CSV parsing with error handling
- Batch upsert operations (500 records at a time)
- Duplicate detection via ON CONFLICT
- Progress tracking

## Deployment

### Backend (Render/Railway/Heroku)
1. Set environment variables in platform dashboard
2. Ensure `DB_TARGET=supabase` if using Supabase
3. Deploy from Git repository

### Frontend (Vercel/Netlify)
1. Set `VITE_API_URL` to your deployed backend URL
2. Deploy from Git repository
3. Ensure CORS is configured on backend

## Troubleshooting

**Database connection issues:**
- Verify connection string format
- Check SSL settings for Supabase (`{ rejectUnauthorized: false }`)
- Ensure database exists and is accessible

**Import errors:**
- Confirm CSV files are in correct format
- Check for duplicate primary keys
- Verify station references exist before importing trips

**API errors:**
- Check server logs for detailed error messages
- Verify query parameters match expected types
- Ensure database views are created successfully

## Future Enhancements

- [ ] Real-time data updates via WebSocket
- [ ] Interactive map visualization
- [ ] Predictive analytics for demand forecasting
- [ ] User authentication and saved preferences
- [ ] Export functionality for reports
- [ ] Weather correlation analysis

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Submit a pull request

## License

MIT License - feel free to use for personal or commercial projects.

## Acknowledgments

- Bay Wheels for providing open bike share data
- Lyft for operating the Bay Wheels system
- Open source communities for excellent tooling

---

**Built with ❤️ for the Bay Area cycling community**