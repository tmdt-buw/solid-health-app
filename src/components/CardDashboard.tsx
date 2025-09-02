// src/components/CardDashboard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { TimePoint } from "../utils/loadFitDataFromPod";
import MetricCard from "./MetricCard";
import CalorieStepsRing from "./CalorieStepsRing";
import "./metric-dashboard.css";

type MetricKey = "steps" | "calories" | "sleep" | "heartRate" | "weight";

type Props = {
  steps: TimePoint[];
  calories: TimePoint[];
  sleep: TimePoint[];
  heartRates: TimePoint[];
  weight?: TimePoint[];
  /** vom Nutzer erlaubte Metriken */
  allowed?: Partial<Record<MetricKey, boolean>>;
};

const latestValue = (arr: TimePoint[]) =>
  arr.length ? Number(arr[arr.length - 1].value).toFixed(1) : "—";
const latestDate = (arr: TimePoint[]) =>
  arr.length ? arr[arr.length - 1].timestamp.slice(0, 10) : "";
const latestNumber = (arr: TimePoint[]) => (arr.length ? arr[arr.length - 1].value : 0);

const CardDashboard: React.FC<Props> = ({
  steps,
  calories,
  sleep,
  heartRates,
  weight = [],
  allowed = {},
}) => {
  const navigate = useNavigate();

  // nur rendern, wenn vom Nutzer erlaubt UND Daten vorhanden
  const show = (key: MetricKey, arr: TimePoint[]) =>
    (allowed[key] ?? true) && arr.length > 0;

  return (
    <div className="metric-dashboard">
      {/* Ring nur zeigen, wenn beide Datensätze vorhanden & erlaubt */}
      {show("steps", steps) && show("calories", calories) && (
        <CalorieStepsRing
          steps={latestNumber(steps)}
          calories={latestNumber(calories)}
        />
      )}

      <div className="metric-grid">
        {show("steps", steps) && (
          <MetricCard
            title="Schritte"
            value={latestValue(steps)}
            unit="St"
            date={latestDate(steps)}
            data={steps}
            onClick={() => navigate("/detail/steps")}
          />
        )}

        {show("calories", calories) && (
          <MetricCard
            title="Kalorien"
            value={latestValue(calories)}
            unit="kcal"
            date={latestDate(calories)}
            data={calories}
            onClick={() => navigate("/detail/calories")}
          />
        )}

        {show("sleep", sleep) && (
          <MetricCard
            title="Schlaf"
            value={latestValue(sleep)}
            unit="h"
            date={latestDate(sleep)}
            data={sleep}
            onClick={() => navigate("/detail/sleep")}
          />
        )}

        {show("heartRate", heartRates) && (
          <MetricCard
            title="Puls"
            value={latestValue(heartRates)}
            unit="bpm"
            date={latestDate(heartRates)}
            data={heartRates}
            onClick={() => navigate("/detail/heartRate")}
          />
        )}

        {show("weight", weight) && (
          <MetricCard
            title="Gewicht"
            value={latestValue(weight)}
            unit="kg"
            date={latestDate(weight)}
            data={weight}
            onClick={() => navigate("/detail/weight")}
          />
        )}
      </div>
    </div>
  );
};

export default CardDashboard;
