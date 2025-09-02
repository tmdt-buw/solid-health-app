// src/services/googleFit/processSleepData.ts

// Google-Fit Schlafphasen (Codes → Labels)
export type SleepStage =
  | "awake"
  | "sleep_unspecified"
  | "out_of_bed"
  | "light"
  | "deep"
  | "rem";

const GOOGLE_FIT_STAGE_MAP: Record<number, SleepStage> = {
  1: "awake",
  2: "sleep_unspecified",
  3: "out_of_bed",
  4: "light",
  5: "deep",
  6: "rem",
};

export type SleepEntry = {
  date: string;               // YYYY-MM-DD in der gewünschten TZ (Standard: Europe/Berlin)
  totalSleepHours: number;    // Summe aus Light + Deep + REM (+ optional unspecified)
  deepSleepPercent: number;
  lightSleepPercent: number;
  remSleepPercent: number;
  wakeTimestamp: string;      
};

type RawPoint = {
  startTimeNanos: string;
  endTimeNanos: string;
  value: Array<{ intVal?: number }>;
};

export function processSleepData(
  points: RawPoint[],
  opts?: {
    timeZone?: string;                    
    countUnspecifiedAs?: "light" | "exclude"; 
  }
): SleepEntry[] {
  const tz = opts?.timeZone ?? "Europe/Berlin";
  const countUnspecAs = opts?.countUnspecifiedAs ?? "light";

  type Bucket = {
    segments: { start: number; end: number; stage: SleepStage }[];
    phaseMin: { deep: number; light: number; rem: number; unspec: number };
  };

  const buckets: Record<string, Bucket> = {};

  for (const p of points ?? []) {
    const startMs = Number.parseInt(p.startTimeNanos, 10) / 1e6;
    const endMs = Number.parseInt(p.endTimeNanos, 10) / 1e6;
    const code = p.value?.[0]?.intVal ?? 0;
    const stage = GOOGLE_FIT_STAGE_MAP[code];
    if (!stage) continue;

    // Gruppierung: Aufwach-Datum (Ende) in gewünschter TZ → "YYYY-MM-DD"
    const dateKey = new Date(endMs).toLocaleDateString("sv-SE", { timeZone: tz });

    if (!buckets[dateKey]) {
      buckets[dateKey] = {
        segments: [],
        phaseMin: { deep: 0, light: 0, rem: 0, unspec: 0 },
      };
    }

    const durMin = Math.max(0, (endMs - startMs) / 60000);
    buckets[dateKey].segments.push({ start: startMs, end: endMs, stage });

    if (stage === "deep") buckets[dateKey].phaseMin.deep += durMin;
    else if (stage === "light") buckets[dateKey].phaseMin.light += durMin;
    else if (stage === "rem") buckets[dateKey].phaseMin.rem += durMin;
    else if (stage === "sleep_unspecified") buckets[dateKey].phaseMin.unspec += durMin;
    // "awake" & "out_of_bed" werden NICHT zur Schlafzeit addiert
  }

  const entries: SleepEntry[] = Object.entries(buckets).map(([date, b]) => {
    const { deep, light, rem, unspec } = b.phaseMin;

    const lightWithUnspec = light + (countUnspecAs === "light" ? unspec : 0);

    const totalSleepMin = deep + lightWithUnspec + rem;
    const toPct = (part: number) =>
      totalSleepMin ? +( (part / totalSleepMin) * 100 ).toFixed(1) : 0;

    const lastEndMs = Math.max(...b.segments.map((s) => s.end));

    return {
      date,
      totalSleepHours: +(totalSleepMin / 60).toFixed(2),
      deepSleepPercent: toPct(deep),
      lightSleepPercent: toPct(lightWithUnspec),
      remSleepPercent: toPct(rem),
      wakeTimestamp: new Date(lastEndMs).toISOString(),
    };
  });

  return entries;
}
