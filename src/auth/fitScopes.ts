export type MetricKey = "steps" | "calories" | "sleep" | "weight" | "heartRate";

export const METRIC_TO_SCOPES: Record<MetricKey, string[]> = {
  steps:     ["https://www.googleapis.com/auth/fitness.activity.read"],
  calories:  ["https://www.googleapis.com/auth/fitness.activity.read"],
  sleep:     ["https://www.googleapis.com/auth/fitness.sleep.read"],
  weight:    ["https://www.googleapis.com/auth/fitness.body.read"],
  heartRate: ["https://www.googleapis.com/auth/fitness.heart_rate.read"],
};

export const DEFAULT_SELECTION: Record<MetricKey, boolean> = {
  steps: true, calories: true, sleep: true, weight: true, heartRate: true,
};

export function scopesFromSelection(sel: Partial<Record<MetricKey, boolean>>): string {
  const s = new Set<string>();
  (Object.keys(sel) as MetricKey[]).forEach(k => sel[k] && METRIC_TO_SCOPES[k].forEach(x => s.add(x)));

  return Array.from(s).join(" ");

}
