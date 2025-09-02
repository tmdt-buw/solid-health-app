
//utils/computeKpis
import { TimePoint } from "./loadFitDataFromPod";

export function computeKpis(
  steps: TimePoint[],
  calories: TimePoint[],
  sleep: TimePoint[],
  weights: TimePoint[],
  heartRates: TimePoint[],
  userHeightCm = 175
) {
  const sliceLastDays = (series: TimePoint[], days: number) => {
    const from = Date.now() - days * 24 * 60 * 60 * 1000;
    return series.filter((p) => new Date(p.timestamp).getTime() >= from);
  };

  const avg = (arr: number[]) =>
    arr.length ? +(arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : undefined;

  const lastVal = <T extends TimePoint>(arr: T[]) => (arr.length ? arr[arr.length - 1].value : undefined);

  const bmi = (kg?: number, cm?: number) => {
    if (!kg || !cm) return undefined;
    const m = cm / 100;
    return +(kg / (m * m)).toFixed(1);
  };

  const steps7 = sliceLastDays(steps, 7);
  const cal7 = sliceLastDays(calories, 7);
  const sleep7 = sliceLastDays(sleep, 7);

  const lastUpdate =
    steps.length || calories.length || sleep.length
      ? [steps, calories, sleep]
          .flat()
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp
      : undefined;

  return {
    stepsAvg7: avg(steps7.map((p) => p.value)),
    stepsToday: lastVal(steps7) ?? lastVal(steps),
    kcalAvg7: avg(cal7.map((p) => p.value)),
    sleepAvg7: avg(sleep7.map((p) => p.value)),
    weightNow: lastVal(weights),
    heartNow: lastVal(heartRates),
    bmiNow: bmi(lastVal(weights), userHeightCm),
    lastUpdate,
  };
}
