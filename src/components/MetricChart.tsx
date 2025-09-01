import React, { useState } from "react";
import { TimePoint } from "../utils/loadFitDataFromPod";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./metric-dashboard.css";

type Props = {
  data: TimePoint[];
  title: string;
  unit?: string;
};

const MetricChart: React.FC<Props> = ({ data, title, unit }) => {
  const [startIndex, setStartIndex] = useState(Math.max(0, data.length - 7));

  const canGoBack = startIndex > 0;
  const canGoForward = startIndex + 7 < data.length;

  const handleBack = () => setStartIndex((i) => Math.max(i - 1, 0));
  const handleForward = () => setStartIndex((i) => Math.min(i + 1, data.length - 7));

  const slice = data.slice(startIndex, startIndex + 7);

  return (
    <div className="metric-chart-card">
      <div className="metric-chart-header">
        <h3>{title}</h3>
        <div className="metric-chart-nav">
          <button onClick={handleBack} disabled={!canGoBack}>&larr;</button>
          <span>
            {slice[0]?.timestamp.slice(0, 10)} – {slice.at(-1)?.timestamp.slice(0, 10)}
          </span>
          <button onClick={handleForward} disabled={!canGoForward}>&rarr;</button>
        </div>
      </div>
      <div className="metric-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={slice}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(d: string) => new Date(d).toLocaleDateString()}
              minTickGap={24}
            />
            <YAxis />
            <Tooltip
              formatter={(val) => `${val} ${unit ?? ""}`}
              labelFormatter={(label) => new Date(String(label)).toLocaleDateString()}
            />
            <Line type="monotone" dataKey="value" stroke="#ff4d4f" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricChart;
