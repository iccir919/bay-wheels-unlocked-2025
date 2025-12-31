export default function TopRoutesChart({ routes, highlight, onSelect }) {
    const topRoutes = routes.slice(0, 4);

    return (
        <div className="bg-white rounded-xl p-4 shadow">
            <h3 className="font-semibold mb-1">Top Routes</h3>

            <ul>
                {topRoutes.map(route => {
                    const routeId = `${route.s1_id}-${route.s2_id}`;
                    const isActive =
                        highlight.type === "route" && highlight.id === routeId;

                    return (
                        <li
                            key={routeId}
                            onClick={() => onSelect("route", routeId)}
                            className={`cursor-pointer p-2 rounded transition
                                ${isActive ? "bg-blue-100 font-semibold" : "hover:bg-slate-100"}
                            `}
                        >
                            <div className="text-sm">
                                <div className="font-medium">
                                    {route.s1_name} ↔ {route.s2_name}
                                </div>
                                <div className="text-slate-500">
                                    {route.total_trips.toLocaleString()} trips
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}