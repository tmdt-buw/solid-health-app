// Mappt UI-Metrik auf Dateinamen im Pod
export type MetricKey = "steps" | "calories" | "sleep" | "heartRate" | "weight";

export const metricFileName: Record<MetricKey, string> = {
  steps: "steps.ttl",
  calories: "calories.ttl",
  sleep: "sleep.ttl",
  heartRate: "heartRates.ttl",
  weight: "weight.ttl",
};
