export default function TopStationsChart({ stations, highlight, onSelect }) {
    const topStations = stations.slice(0, 4);

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
                                onClick={() => 
                                    onSelect("station", station.station_id)
                                }
                                className={`cursor-pointer p-2 rounded transaction
                                    ${isActive ? "bg-pink-100 font-semibold" : "hover:bg-slate-100"}
                                `}
                            >
                                <div className="flex justify-between">
                                    <span>{station.name}</span>
                                    <span className="text-slate-500">
                                        {station.total_trips.toLocaleString()}
                                    </span>
                                </div>
                            </li>
                        );
                })}
            </ul>
        </div>
    );
}