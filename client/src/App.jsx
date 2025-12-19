
import React, { useState, useEffect } from "react"
import StatCard from "./components/StatCard.jsx"
import './App.css'

const API_BASE_URL = "http://localhost:3000/api"

function BayWheelsUnlocked() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({ 
      yearly: null, 
      topRoutes: []
    })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [yearlyRes, routesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/trips/summary/yearly`),
        fetch(`${API_BASE_URL}/trips/routes/top?limit=10`)
      ])

      const yearly = await yearlyRes.json()
      const routes = await routesRes.json()

      setData({
        yearly: yearly.data,
        topRoutes: routes.data
      })

    } catch (err) {
      setError("There has been an error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Loading Bay Wheels 2025 data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-red-600">Error: {error}</p>
        </div>
      </div>
    )
  }

  const { yearly, topRoutes } = data


  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  }

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🚲 Bay Wheels Unlocked 2025</h1>
          <p className="text-lg text-gray-600">Analysis and insight for January to October 2025</p>
        </header>

        {/* Yearly Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Trips"
            value={formatNumber(yearly.total_trips)}
            icon="🚴"
          />

          <StatCard
            title="Total Distance"
            value={`${formatNumber(Math.round(yearly.total_distance_miles))} mi`}
            icon="📍"
          />

          <StatCard
            title="Avg Duration"
            value={formatDuration(yearly.avg_duration_minutes)}
            icon="⏱️"
          />

          <StatCard
            title="Unique Stations"
            value={formatNumber(yearly.unique_stations)}
            icon="🏢"
          />

        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Routes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🔥 Top Routes</h2>
            <div className="space-y-3">
              {topRoutes.slice(0, 5).map((route, idx) => {
                const isRoundTrip = route.start_station_id === route.end_station_id;
                
                return (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-sm mb-1">
                          {route.start_station_name}
                        </div>
                        {!isRoundTrip && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <span>↓</span>
                            <span className="ml-1">{route.end_station_name}</span>
                          </div>
                        )}
                        {isRoundTrip && (
                          <div className="text-xs text-emerald-600 font-medium flex items-center">
                            <span>🔄</span>
                            <span className="ml-1">Round Trip</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-2xl font-bold text-indigo-600">
                          {formatNumber(route.trips_on_route)}
                        </div>
                        <div className="text-xs text-gray-500">trips</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-200">
                      <div>
                        <span className="text-gray-500">Avg Duration: </span>
                        <span className="font-semibold text-gray-700">
                          {formatDuration(parseFloat(route.avg_duration_minutes))}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div>
                          <span className="text-gray-500">Members: </span>
                          <span className="font-semibold text-blue-600">{formatNumber(route.member_trips)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Casual: </span>
                          <span className="font-semibold text-purple-600">{formatNumber(route.casual_trips)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default BayWheelsUnlocked
