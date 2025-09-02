// src/components/MetricDashboard.tsx
import React, { useState } from "react";
import MetricCard from "./MetricCard";
import MetricChart from "./MetricChart";
import { TimePoint } from "../utils/loadFitDataFromPod";
import "./metric-dashboard.css";

type Props = {
  steps: TimePoint[];
  calories: TimePoint[];
  sleep: TimePoint[];
  heartRates: TimePoint[];
  weight: TimePoint[]; 
};

type MetricType = "steps" | "calories" | "sleep" | "heartRate" | "weight" | null;

const MetricDashboard: React.FC<Props> = ({
  steps,
  calories,
  sleep,
  heartRates,
  weight, 
}) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>(null);

  const latestValue = (arr: TimePoint[]) =>
    arr.length ? arr[arr.length - 1].value.toFixed(2) : "—";
  const latestDate = (arr: TimePoint[]) =>
    arr.length ? arr[arr.length - 1].timestamp.slice(0, 10) : "";

  const getData = () => {
    switch (activeMetric) {
      case "steps":
        return steps;
      case "calories":
        return calories;
      case "sleep":
        return sleep.map((e) => ({
          ...e,
          value: Number(e.value.toFixed(2)),
        }));
      case "heartRate":
        return heartRates;
      case "weight":               
        return weight;
      default:
        return [];
    }
  };

  const getLabel = () => {
    switch (activeMetric) {
      case "steps":
        return { title: "Schritte", unit: "St" };
      case "calories":
        return { title: "Kalorien", unit: "kcal" };
      case "sleep":
        return { title: "Schlaf", unit: "h" };
      case "heartRate":
        return { title: "Herzfrequenz", unit: "bpm" };
      case "weight":              
        return { title: "Gewicht", unit: "kg" };
      default:
        return { title: "", unit: "" };
    }
  };

  return (
    <div className="metric-dashboard">
      <div className="metric-grid">
        <MetricCard
          title="Schritte"
          value={latestValue(steps)}
          unit="St"
          date={latestDate(steps)}
          onClick={() => setActiveMetric("steps")}
        />
        <MetricCard
          title="Kalorien"
          value={latestValue(calories)}
          unit="kcal"
          date={latestDate(calories)}
          onClick={() => setActiveMetric("calories")}
        />
        <MetricCard
          className="sleep-card" 
          title="Schlaf"
          value={latestValue(sleep)}
          unit="h"
          date={latestDate(sleep)}
          onClick={() => setActiveMetric("sleep")}
        />
        <MetricCard
          title="Puls"
          value={latestValue(heartRates)}
          unit="bpm"
          date={latestDate(heartRates)}
          onClick={() => setActiveMetric("heartRate")}
        />
        <MetricCard
          title="Gewicht"
          value={latestValue(weight)}   
          unit="kg"
          date={latestDate(weight)}      
          data={weight}                
          onClick={() => setActiveMetric("weight")}
        />
      </div>

      {activeMetric && (
        <div className="metric-chart-popup">
          <button className="close-btn" onClick={() => setActiveMetric(null)}>✕</button>
          <MetricChart data={getData()} title={getLabel().title} unit={getLabel().unit} />
        </div>
      )}
    </div>
  );
};

export default MetricDashboard;
