// processFitData.ts
export const processFitData = (data: any) => {
  const weights: { timestamp: string; value: number }[] = [];
  const heartRates: { timestamp: string; value: number }[] = [];
  const steps: { timestamp: string; value: number }[] = [];
  const calories: { timestamp: string; value: number }[] = [];

  const buckets: any[] = Array.isArray(data?.bucket) ? data.bucket : [];

  for (const bucket of buckets) {
    for (const ds of bucket.dataset ?? []) {
      for (const point of ds.point ?? []) {
        const tsNanos = point.startTimeNanos ?? point.startTimeMillis?.toString();
        if (!tsNanos) continue;
        const timestamp = new Date(parseInt(tsNanos, 10) / 1e6).toISOString();

        const id = ds.dataSourceId ?? "";
        if (id.includes("weight")) {
          const kg = point.value?.[0]?.fpVal;
          if (kg != null) weights.push({ timestamp, value: kg });
        } else if (id.includes("heart_rate")) {
          const bpm = point.value?.[0]?.fpVal;
          if (bpm != null) heartRates.push({ timestamp, value: bpm });
        } else if (id.includes("step_count")) {
          const count = point.value?.[0]?.intVal;
          if (count != null) steps.push({ timestamp, value: count });
        } else if (id.includes("calories")) {
          const kcal = point.value?.[0]?.fpVal;
          if (kcal != null) calories.push({ timestamp, value: kcal });
        }
      }
    }
  }

  const sortedWeights = [...weights].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const latestWeight = sortedWeights.length > 0 ? sortedWeights[0] : null;

  return { weights, latestWeight, heartRates, steps, calories };
};
