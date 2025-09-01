// src/components/MetricDetail.tsx
import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart, Bar,
  AreaChart, Area,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
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

// Helfer für Aggregations-Schlüssel
const keyDay = (d: Date) => d.toLocaleDateString("sv-SE"); // YYYY-MM-DD
const keyWeek = (d: Date) => {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((dt.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7);
  return `${dt.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};
const keyMonth = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default function MetricDetail({ dataMap, onDeleteMetric, onDisconnectGoogle }: Props) {
  const params = useParams<{ metric: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"day" | "week" | "month">("day");

  // Sicherstellen, dass eine gültige Metrik verwendet wird
  const metric: Metric = useMemo(() => {
    const raw = (params.metric ?? "steps") as string;
    const list: Metric[] = ["steps", "calories", "sleep", "heartRate", "weight"];
    return list.includes(raw as Metric) ? (raw as Metric) : "steps";
  }, [params.metric]);

  const titleMap: Record<Metric, { title: string; unit: string }> = {
    steps: { title: "Schritte", unit: "St" },
    calories: { title: "Kalorien", unit: "kcal" },
    sleep: { title: "Schlaf", unit: "h" },
    heartRate: { title: "Puls", unit: "bpm" },
    weight: { title: "Gewicht", unit: "kg" },
  };

  // Rohdaten der aktiven Metrik
  const raw: TimePoint[] = useMemo(() => dataMap[metric] ?? [], [dataMap, metric]);

  // letzte 90 Tage
  const data90: TimePoint[] = useMemo(() => {
    const limit = Date.now() - 90 * 24 * 3600 * 1000;
    return raw.filter((p) => new Date(p.timestamp).getTime() >= limit);
  }, [raw]);

  // Aggregation: Summe für steps/calories/sleep, Durchschnitt für heartRate/weight
  //  jeder Datenpunkt bekommt eine stabile, eindeutige id 
  const agg = useMemo(() => {
    const byKey = new Map<string, number[]>();
    for (const p of data90) {
      const d = new Date(p.timestamp);
      const k = mode === "day" ? keyDay(d) : mode === "week" ? keyWeek(d) : keyMonth(d);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k)!.push(p.value);
    }
    const reduceToValue = (arr: number[]) => {
      if (metric === "steps" || metric === "calories" || metric === "sleep") {
        return arr.reduce((a, b) => a + b, 0);
      }
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      return Math.round(avg * 100) / 100;
    };

    // sortieren und id mitgeben
    return Array.from(byKey.entries())
      .map(([label, arr], idx) => ({
        id: `${label}-${idx}`,           
        label,
        value: reduceToValue(arr),
      }))
      .sort((a, b) => (a.label < b.label ? -1 : 1));
  }, [data90, mode, metric]);

  const { title, unit } = titleMap[metric];
  const isBar = metric === "steps";
  const isArea = metric === "heartRate";
  const color =
    metric === "steps" ? "#60a5fa" :
    metric === "calories" ? "#f59e0b" :
    metric === "sleep" ? "#a855f7" : "#ef4444";

  // Aktionen
  const askDelete = async () => {
    if (!onDeleteMetric) return;
    const ok = window.confirm(`Alle gespeicherten ${title}-Daten aus deinem Pod löschen?`);
    if (!ok) return;
    await onDeleteMetric(metric as MetricKey);
    navigate(-1);
  };

  const disconnect = async () => {
    if (!onDisconnectGoogle) return;
    const ok = window.confirm("Google Fit trennen? Neue Daten werden dann nicht mehr synchronisiert.");
    if (!ok) return;
    await onDisconnectGoogle();
    navigate(-1);
  };

  return (
    <div className="mdetail">
      {/* Header */}
      <div className="mdetail-header">
        <button className="mdetail-back" onClick={() => navigate(-1)}>←</button>
        <div>
          <div className="mdetail-title">{title}</div>
          <div className="mdetail-sub">letzte 90 Tage</div>
        </div>

        <div className="mdetail-actions">
          <button className="btn ghost" onClick={disconnect}>Google trennen</button>
          <button className="btn danger" onClick={askDelete}>Daten löschen</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mdetail-tabs">
        <button className={mode === "day" ? "active" : ""} onClick={() => setMode("day")}>Tag</button>
        <button className={mode === "week" ? "active" : ""} onClick={() => setMode("week")}>Woche</button>
        <button className={mode === "month" ? "active" : ""} onClick={() => setMode("month")}>Monat</button>
      </div>

      {/* Chart */}
      <div className="mdetail-chart">
        <ResponsiveContainer width="100%" height={280}>
          {isBar ? (
            <BarChart data={agg}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" minTickGap={24} />
              <YAxis />
              <Tooltip formatter={(v: any) => [`${v} ${unit}`, title]} />
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
              <Tooltip formatter={(v: any) => [`${v} ${unit}`, title]} />
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
              <Tooltip formatter={(v: any) => [`${v} ${unit}`, title]} />
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
