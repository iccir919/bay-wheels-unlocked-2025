import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function TripsByDayChart({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-lg font-semibold">Trips By Day of Week</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, bottom: 10, left: 60 }}
          barCategoryGap="15%" // less gap between categories
        >
          <XAxis type="number" />
          <YAxis type="category" dataKey="day_name" />
          <Bar
            fill="#2563eb"
            dataKey="trips"
            radius={[0, 6, 6, 0]}
            barSize={25}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
