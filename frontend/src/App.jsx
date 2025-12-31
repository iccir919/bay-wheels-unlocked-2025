import { useState, useEffect } from 'react';
import KpiCard from "./components/KpiCard.jsx";
import MapView from "./components/MapView.jsx";
import MapToggle from "./components/MapToggle.jsx";

// Charts
import TopStationsChart from "./components/charts/TopStationsChart";
import TopRoutesChart from './components/charts/TopRoutesChart.jsx';


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
    commonRoutes
  } = data.results;
  
  const kpi = overview[0];

  return (
    <div className="min-h-screen p-6 space-y-10">

      <header className="mb-8">
        <h1 className="text-3xl font-bold">🚲 Bay Wheels Unlocked 2025</h1>
        <p className="text-slate-500 mt-1">System-wide usage review of data between January and November 2025.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard icon="📊" label="Total Trips" value={kpi.total_trips.toLocaleString()} />
        <KpiCard icon="⏱️" label="Avg Duration" value={`${kpi.avg_duration_minutes} min`} />
        <KpiCard icon="👥" label="Subscribers" value={`${Math.round((kpi.member_trips / kpi.total_trips) * 100)}%`} />
        <KpiCard icon="⚡" label="Electric Rides" value={kpi.electric_trips.toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapView
            mapView={mapView}
            stations={stations}
            routes={commonRoutes}
            highlight={highlight}
            onSelect={toggleHighlight}
            onClear={() => setHighlight({ type: null, id: null })}
          />
        </div>

        <div className="space-y-3">
          <TopStationsChart
            stations={stations}
            highlight={highlight}
            onSelect={toggleHighlight}
          />

          <TopRoutesChart 
            routes={commonRoutes}
            highlight={highlight}
            onSelect={toggleHighlight}
          />
        </div>
      </div>

    </div>
  );
}

export default App;
