import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TimePoint } from "../utils/loadFitDataFromPod";
import { MetricKey } from "../utils/metricFiles";
import "./metric-detail.css";

type Metric = "steps" | "calories" | "sleep" | "heartRate" | "weight";

type Props = {
  dataMap: Record<Metric, TimePoint[]>;
  onDeleteMetric?: (metric: MetricKey) => Promise<void> | void;
  onDisconnectGoogle?: () => Promise<void> | void;
};

const keyDay = (date: Date) => date.toLocaleDateString("sv-SE");
const keyWeek = (date: Date) => {
  const dt = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((dt.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7);
  return `${dt.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};
const keyMonth = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export default function MetricDetail({ dataMap, onDeleteMetric, onDisconnectGoogle }: Props) {
  const params = useParams<{ metric: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"day" | "week" | "month">("day");

  const metric: Metric = useMemo(() => {
    const raw = (params.metric ?? "steps") as string;
    const list: Metric[] = ["steps", "calories", "sleep", "heartRate", "weight"];
    return list.includes(raw as Metric) ? (raw as Metric) : "steps";
  }, [params.metric]);

  const titleMap: Record<Metric, { title: string; unit: string }> = {
    steps: { title: "Steps", unit: "" },
    calories: { title: "Calories", unit: "kcal" },
    sleep: { title: "Sleep", unit: "h" },
    heartRate: { title: "Heart rate", unit: "bpm" },
    weight: { title: "Weight", unit: "kg" },
  };

  const raw: TimePoint[] = useMemo(() => dataMap[metric] ?? [], [dataMap, metric]);

  const data90: TimePoint[] = useMemo(() => {
    const limit = Date.now() - 90 * 24 * 3600 * 1000;
    return raw.filter((point) => new Date(point.timestamp).getTime() >= limit);
  }, [raw]);

  const agg = useMemo(() => {
    const byKey = new Map<string, number[]>();
    for (const point of data90) {
      const date = new Date(point.timestamp);
      const key = mode === "day" ? keyDay(date) : mode === "week" ? keyWeek(date) : keyMonth(date);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(point.value);
    }

    const reduceToValue = (values: number[]) => {
      if (metric === "steps" || metric === "calories" || metric === "sleep") {
        return values.reduce((a, b) => a + b, 0);
      }
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return Math.round(avg * 100) / 100;
    };

    return Array.from(byKey.entries())
      .map(([label, values], idx) => ({
        id: `${label}-${idx}`,
        label,
        value: reduceToValue(values),
      }))
      .sort((a, b) => (a.label < b.label ? -1 : 1));
  }, [data90, mode, metric]);

  const { title, unit } = titleMap[metric];
  const isBar = metric === "steps";
  const isArea = metric === "heartRate";
  const color =
    metric === "steps"
      ? "#60a5fa"
      : metric === "calories"
        ? "#f59e0b"
        : metric === "sleep"
          ? "#a855f7"
          : "#ef4444";

  const askDelete = async () => {
    if (!onDeleteMetric) return;
    const ok = window.confirm(`Delete all stored ${title} data from your Pod?`);
    if (!ok) return;
    await onDeleteMetric(metric as MetricKey);
    navigate(-1);
  };

  const disconnect = async () => {
    if (!onDisconnectGoogle) return;
    const ok = window.confirm("Disconnect Google Fit? New data will no longer be synchronized.");
    if (!ok) return;
    await onDisconnectGoogle();
    navigate(-1);
  };

  return (
    <div className="mdetail">
      <div className="mdetail-header">
        <button className="mdetail-back" onClick={() => navigate(-1)}>&larr;</button>
        <div>
          <div className="mdetail-title">{title}</div>
          <div className="mdetail-sub">Last 90 days</div>
        </div>

        <div className="mdetail-actions">
          <button className="btn ghost" onClick={disconnect}>Disconnect Google</button>
          <button className="btn danger" onClick={askDelete}>Delete data</button>
        </div>
      </div>

      <div className="mdetail-tabs">
        <button className={mode === "day" ? "active" : ""} onClick={() => setMode("day")}>Day</button>
        <button className={mode === "week" ? "active" : ""} onClick={() => setMode("week")}>Week</button>
        <button className={mode === "month" ? "active" : ""} onClick={() => setMode("month")}>Month</button>
      </div>

      <div className="mdetail-chart">
        <ResponsiveContainer width="100%" height={280}>
          {isBar ? (
            <BarChart data={agg}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" minTickGap={24} />
              <YAxis />
              <Tooltip formatter={(value: any) => [`${value} ${unit}`.trim(), title]} />
              <Bar
                dataKey="value"
                fill={color}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          ) : isArea ? (
            <AreaChart data={agg}>
              <defs>
                <linearGradient id="gradHR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" minTickGap={24} />
              <YAxis />
              <Tooltip formatter={(value: any) => [`${value} ${unit}`, title]} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#gradHR)"
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            </AreaChart>
          ) : (
            <LineChart data={agg}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" minTickGap={24} />
              <YAxis />
              <Tooltip formatter={(value: any) => [`${value} ${unit}`, title]} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
