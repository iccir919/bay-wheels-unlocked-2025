export default function TopStationsChart({ stations, highlight, onSelect }) {
    const topStations = stations.slice(0, 3);

    return (
        <div className="bg-white rounded-xl p-3 shadow">
            <h3 className="font-semibold mb-1">Top Stations</h3>

            <ul>
                {topStations.map(station => {
                    const isActive = 
                        highlight.type === "station" &&
                        highlight.id === station.station_id;
                        return (
                            <li
                                key={station.station_id}
                                onClick={() => onSelect("station", station.station_id)}
                                className={`cursor-pointer p-2 rounded transition
                                    ${isActive ? "bg-blue-100 font-semibold" : "hover:bg-slate-100"}
                                `}
                            >
                                <div className="text-sm">
                                    <div className="font-medium">{station.name}</div>
                                    <div className="text-slate-500">{station.total_trips.toLocaleString()} trips</div>
                                </div>
                            </li>
                        );
                })}
            </ul>
        </div>
    );
}