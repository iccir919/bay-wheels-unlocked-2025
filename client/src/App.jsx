import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const StatCard = ({ emoji, label, value, subtext }) => (
  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
          <span className="text-lg">{emoji}</span>
          <span>{label}</span>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {value}
        </div>
        {subtext && (
          <div className="text-sm text-gray-500">{subtext}</div>
        )}
      </div>
    </div>
  </div>
);

export default function BikeShareDashboard() {
  const [overview, setOverview] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [topStations, setTopStations] = useState([]);
  const [topRoutes, setTopRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, monthlyRes, hourlyRes, stationsRes, routesRes] = await Promise.all([
          fetch(`${API_BASE}/summary/overview`),
          fetch(`${API_BASE}/summary/monthly`),
          fetch(`${API_BASE}/patterns/hourly`),
          fetch(`${API_BASE}/stations/top?limit=20`),
          fetch(`${API_BASE}/routes/top?limit=15&minTrips=20`)
        ]);

        const overviewData = await overviewRes.json();
        const monthlyData = await monthlyRes.json();
        const hourlyData = await hourlyRes.json();
        const stationsData = await stationsRes.json();
        const routesData = await routesRes.json();

        setOverview(overviewData.data);
        setMonthly(monthlyData.data || []);
        setHourly(hourlyData.data || []);
        setTopStations(stationsData.data || []);
        setTopRoutes(routesData.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString();
  };

  const memberPercent = overview ? 
    ((overview.total_member_trips / overview.total_trips) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🚴</span>
            <h1 className="text-3xl font-bold">Bay Wheels Unlocked 2025</h1>
          </div>
          <p className="text-blue-100">Insights into usage from January to October 2025</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            emoji="📈"
            label="Total Trips"
            value={formatNumber(overview?.total_trips)}
            subtext="All time"
          />
          <StatCard
            emoji="📍"
            label="Active Stations"
            value={formatNumber(overview?.unique_stations)}
            subtext="Network-wide"
          />
          <StatCard
            emoji="⏱️"
            label="Avg Trip Duration"
            value={`${overview?.avg_trip_duration_minutes || 0} min`}
            subtext="Per ride"
          />
          <StatCard
            emoji="👥"
            label="Member Usage"
            value={`${memberPercent}%`}
            subtext={`${formatNumber(overview?.total_member_trips)} trips`}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Trip Volume</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total_trips" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Total Trips"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Pattern */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Hourly Usage Pattern</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="hour_of_day" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem'
                  }}
                />
                <Legend />
                <Bar dataKey="member_trips" fill="#3b82f6" name="Members" />
                <Bar dataKey="casual_trips" fill="#f59e0b" name="Casual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Routes & Top Stations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Routes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Routes</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {topRoutes.slice(0, 10).map((route, i) => {
                const isRoundTrip = route.start_station_id === route.end_station_id;
                return (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 uppercase">From:</span>
                            <span className="font-medium text-gray-900 text-sm">
                              {route.start_station_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 uppercase">To:</span>
                            <span className={`text-sm ${isRoundTrip ? 'text-green-600 font-semibold' : 'text-gray-700'}`}>
                              {isRoundTrip ? 'Round Trip' : route.end_station_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatNumber(route.total_trips)}
                        </div>
                        <div className="text-xs text-gray-500">trips</div>
                      </div>
                    </div>
                    
                    {/* Duration and User Breakdown */}
                    <div className="flex items-center gap-6 pt-3 border-t border-gray-100 text-xs text-gray-600">
                      <div>
                        <span className="font-medium text-gray-500">Distance:</span> {route.distance_between_stations_miles} mi
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Duration:</span> {route.avg_duration_minutes} min
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Members:</span> {route.member_count.toLocaleString()} ({route.member_percent}%)
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Casual:</span> {route.casual_count.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Stations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Stations</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {topStations.slice(0, 10).map((station, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {station.station_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatNumber(station.total_activity)} trips • {station.member_percent}% members
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(station.trips_started)}
                    </div>
                    <div className="text-xs text-gray-500">starts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rider Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rider Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <div className="flex items-center gap-2 text-blue-700 mb-3">
                <span className="text-2xl">👤</span>
                <span className="font-semibold">Members</span>
              </div>
              <div className="text-4xl font-bold text-blue-900 mb-2">
                {formatNumber(overview?.total_member_trips)}
              </div>
              <div className="text-lg font-semibold text-blue-700">
                {((overview?.total_member_trips / overview?.total_trips) * 100).toFixed(1)}% of all trips
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
              <div className="flex items-center gap-2 text-purple-700 mb-3">
                <span className="text-2xl">🚶</span>
                <span className="font-semibold">Casual Riders</span>
              </div>
              <div className="text-4xl font-bold text-purple-900 mb-2">
                {formatNumber(overview?.total_casual_trips)}
              </div>
              <div className="text-lg font-semibold text-purple-700">
                {((overview?.total_casual_trips / overview?.total_trips) * 100).toFixed(1)}% of all trips
              </div>
            </div>
          </div>
        </div>

        {/* Bike Type Comparison */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Electric vs Classic Bikes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6">
              <div className="flex items-center gap-2 text-amber-700 mb-3">
                <span className="text-2xl">⚡</span>
                <span className="font-semibold">Electric Bikes</span>
              </div>
              <div className="text-4xl font-bold text-amber-900 mb-2">
                {formatNumber(overview?.electric_bike_trips)}
              </div>
              <div className="text-lg font-semibold text-amber-700">
                {((overview?.electric_bike_trips / overview?.total_trips) * 100).toFixed(1)}% of all trips
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
              <div className="flex items-center gap-2 text-green-700 mb-3">
                <span className="text-2xl">🚲</span>
                <span className="font-semibold">Classic Bikes</span>
              </div>
              <div className="text-4xl font-bold text-green-900 mb-2">
                {formatNumber(overview?.classic_bike_trips)}
              </div>
              <div className="text-lg font-semibold text-green-700">
                {((overview?.classic_bike_trips / overview?.total_trips) * 100).toFixed(1)}% of all trips
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}