import React from "react";
import { TimePoint } from "../utils/loadFitDataFromPod";
import {
  ResponsiveContainer,
  LineChart, Line,
  AreaChart, Area,
  Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import "./metric-dashboard.css";

type MetricCardProps = {
  title: string;
  value: string | number;
  unit?: string;
  date?: string;
  data?: TimePoint[];
  onClick?: () => void;
  className?: string; 
};

const isHeart = (title: string, unit?: string) =>
  unit?.toLowerCase() === "bpm" || /herz|puls|heart/i.test(title);
const isSleep = (title: string, unit?: string) =>
  unit?.toLowerCase() === "h" || /sleep|schlaf/i.test(title);
const isSteps = (title: string, unit?: string) =>
  unit?.toLowerCase() === "st" || /steps|schritte|exercise/i.test(title);
const isWeight = (title: string, unit?: string) =>
  unit?.toLowerCase() === "kg" || /weight|gewicht/i.test(title);

const sleepGoalHrs = 8;
function formatSleep(hoursFloat: number) {
  const h = Math.floor(hoursFloat);
  const m = Math.round((hoursFloat - h) * 60);
  return `${h} h ${m.toString().padStart(2, "0")} min`;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = "",
  date,
  data = [],
  onClick,
  className,
}) => {
  const heart = isHeart(title, unit);
  const sleep = isSleep(title, unit);
  const steps = isSteps(title, unit);
  const weight = isWeight(title, unit);

  const gid = (suffix: string) => `${suffix}-${title.replace(/\s+/g, "-")}`;
  const lastIdx = Math.max(0, data.length - 1);

  const displayValue = sleep
    ? (typeof value === "number" ? formatSleep(value) : value)
    : value;

  //Sleep 
  const lastSleepVal = (() => {
    if (data.length) return Number(data[data.length - 1].value) || 0;
    if (typeof value === "number") return value;
    const parsed = parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  })();
  const sleepPct = Math.max(0, Math.min(100, (lastSleepVal / sleepGoalHrs) * 100));

  return (
    <div className="metric-card-full" onClick={onClick}>
      <div className="metric-card-header">
        <div className="metric-card-title">{title}</div>
        <div className="metric-card-date">{date}</div>
      </div>

      <div className="metric-card-value">
        <span className="metric-value">{displayValue}</span>
        {!sleep && <span className="metric-unit">{unit}</span>}
      </div>

      <div className="metric-card-chart">
        {sleep ? (
          
          <div className="sleep-bar">
            <div className="sleep-bar-bg" />
            <div className="sleep-bar-fill" style={{ width: `${sleepPct}%` }} />
            <div className="sleep-bar-cap" style={{ left: `calc(${sleepPct}% - 4px)` }} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={56}>
            {heart ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={gid("hrGrad")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis hide dataKey="timestamp" />
                <YAxis hide domain={["dataMin-5", "dataMax+5"]} />
                <Tooltip
                  formatter={(v: any) => [`${v} bpm`, "Puls"]}
                  labelFormatter={(l) => new Date(String(l)).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill={`url(#${gid("hrGrad")})`}
                  dot={false}
                />
              </AreaChart>
            ) : steps ? (
              <LineChart data={data}>
                <defs>
                  <linearGradient id={gid("stepsGrad")} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis hide dataKey="timestamp" />
                <YAxis hide />
                <Tooltip
                  formatter={(v: any) => [`${v}`, "Schritte"]}
                  labelFormatter={(l) => new Date(String(l)).toLocaleDateString()}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={`url(#${gid("stepsGrad")})`}
                  strokeWidth={2}
                  dot={(props: any) =>
                    props.index === lastIdx ? (
                      <circle cx={props.cx} cy={props.cy} r={4} fill="#f97316" stroke="none" />
                    ) : (
                      <g />
                    )
                  }
                />
              </LineChart>
            ) : weight ? (
              <LineChart data={data}>
                <defs>
                  <linearGradient id={gid("wGrad")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis hide dataKey="timestamp" />
                <YAxis hide domain={["dataMin-1", "dataMax+1"]} />
                <Tooltip
                  formatter={(v: any) => [`${v} kg`, "Gewicht"]}
                  labelFormatter={(l) => new Date(String(l)).toLocaleDateString()}
                />
                {/* weicher Schatten */}
                <AreaChart data={data}>
                  <Area type="monotone" dataKey="value" fill={`url(#${gid("wGrad")})`} stroke="none" />
                </AreaChart>
                <Line type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3, stroke: "none", fill: "#60a5fa" }} />
              </LineChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis hide dataKey="timestamp" />
                <YAxis hide />
                <Tooltip
                  formatter={(v: any) => [`${v} ${unit}`, title]}
                  labelFormatter={(l) => new Date(String(l)).toLocaleDateString()}
                />
                <Line type="monotone" dataKey="value" stroke="#60a5fa" dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
