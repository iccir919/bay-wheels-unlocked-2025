import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function TripsByHour ({ data }) {
    if (!data) return null;

    return (
        <div className="bg-white rounded shadow p-4">
            <h3 className="text-lg font-semibold">
                Trips By Hour
            </h3>
            <p className="text-sm text-slate-500 mb-3">
                Avg ride duration shown on hover
            </p>

            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data}>
                    <XAxis 
                        dataKey="hour"
                        tickFormatter={(h) => `${h}:00`}
                    />
                    <YAxis />
                    <Tooltip
                        formatter={(value, name) => {
                        if (name === "trips") {
                            return [`${value.toLocaleString()} trips`, "Trips"];
                        }
                        return value;
                        }}
                        labelFormatter={(hour) => {
                        const d = data.find(h => h.hour === hour);
                        return (
                            `Hour: ${hour}:00\nAvg duration: ${d?.avg_duration_minutes} min`
                        );
                        }}
                    />
                    <Bar
                        fill="#2563eb"
                        dataKey="trips"
                        radius={[6, 6, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}