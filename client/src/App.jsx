
import React, { useState, useEffect } from "react"
import { tripsApi } from "./services/api"
import './App.css'

function BayWheelsUnlocked() {
  const [data, setData] = useState({ yearly: null, routes: []})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [yearlyRes] = await Promise.all([
        tripsApi.getYearlySummary()
      ])

      setData({
        yearly: yearlyRes.data
      })

    } catch (err) {
      console.error("Error fetching data:", err)
      setError("There has been an error", err)
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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bay Wheels Unlocked 2025</h1>
          <p className="text-lg text-gray-600">The Year in Review</p>
        </div>


      </div>
    </div>
  )
}

export default BayWheelsUnlocked
