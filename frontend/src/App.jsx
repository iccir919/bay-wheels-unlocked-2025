import { useState, useEffect } from 'react';
import KpiCard from "./components/KpiCard.jsx";
import MapView from "./components/MapView.jsx";
import MapToggle from "./components/MapToggle.jsx";

// Charts
import TopStationsChart from "./components/charts/TopStationsChart";
import TopRoutesChart from './components/charts/TopRoutesChart.jsx';
import TripsByHourChart from "./components/charts/TripsByHourChart.jsx";
import TripsByDayOfWeekChart from "./components/charts/TripsByDayOfWeekChart.jsx";


function App() {
  const [data, setData] = useState(null);
  const [mapView, setMapView] = useState("both");
  const [highlight, setHighlight] = useState({ type: null, id: null })

  useEffect(() => {
    fetch("/data/master_analysis.json")
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Failed to load data", err));
  }, [])

  function handleMapModeChange(nextMode) {
    setMapView(nextMode);
    setHighlight({ type: null, id: null });
  }


  function toggleHighlight(type, id) {
    console.log(type, id)
    setHighlight(prev => {
      if (prev.type === type && prev.id === id) {
        return { type: null, id: null }; 
      }
      return { type, id }; 
    });
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500"></div>
        <span className="ml-4 text-lg text-slate-600">Loading data...</span>
      </div>
    )
  }

  const {
    overview,
    stations,
    commonRoutes,
    tripsByHour,
    tripsByDayOfWeek
  } = data.results;
  
  const kpi = overview[0];

  return (
    <div className="min-h-screen p-6 space-y-10">

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">🚲 Bay Wheels Unlocked 2025</h1>
        <p className="text-slate-500 mt-1">System-wide usage review of data between January and November 2025.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard icon="📊" label="Total Trips" value={kpi.total_trips.toLocaleString()} />
        <KpiCard icon="⏱️" label="Avg Duration" value={`${kpi.avg_duration_minutes} min`} />
        <KpiCard icon="👥" label="Subscribers" value={`${Math.round((kpi.member_trips / kpi.total_trips) * 100)}%`} />
        <KpiCard icon="⚡" label="Electric Rides" value={kpi.electric_trips.toLocaleString()} />
      </div>

      {/* Map + Top Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-row lg:flex-col gap-4">
            <div className="flex-1">
                <TopStationsChart
                    stations={stations}
                    highlight={highlight}
                    onSelect={toggleHighlight}
                />
            </div>

            <div className="flex-1">
                <TopRoutesChart
                    routes={commonRoutes}
                    highlight={highlight}
                    onSelect={toggleHighlight}
                />
            </div>
        </div>

        <div className="lg:col-span-2">
          <MapView
            mapView={mapView}
            stations={stations}
            routes={commonRoutes}
            highlight={highlight}
            onSelect={toggleHighlight}
            onClear={() => setHighlight({ type: null, id: null })}
          />

          <MapToggle
            value={mapView}
            onChange={handleMapModeChange}
          />
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="grid grid-cols-1 gap-6">
      </div>

      {/* Weekly & Hourly Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TripsByHourChart data={tripsByHour} />
        <TripsByDayOfWeekChart data={tripsByDayOfWeek} />
      </div>

    </div>
  );
}

export default App;
