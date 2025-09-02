// src/utils/syncGoogleToPod.ts
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";
import { saveFitDataToPod } from "./saveFitDataToPod";
import { ensureFitFolderExists } from "./ensureFitFolderExists";

import { fetchGeneralFitData } from "../services/googleFit/fetchGeneralFitData";
import { fetchSleepData } from "../services/googleFit/fetchSleepData";
import { processFitData } from "../services/googleFit/processFitData";
import { processSleepData } from "../services/googleFit/processSleepData";
import { MetricKey } from "../auth/fitScopes";

const fileUrl = (base: string, name: string) => `${base}fit/${name}`;

export async function syncGoogleToPod(
  podBaseUrl: string,
  googleToken: string,
  selected: Partial<Record<MetricKey, boolean>>
) {
  const session = getDefaultSession();
  await ensureFitFolderExists(podBaseUrl);

  // 1) Rohdaten holen 
  const rawFit = await fetchGeneralFitData(googleToken).catch(() => null);
  const rawSleep = selected.sleep ? await fetchSleepData(googleToken).catch(() => null) : null;

  // Wenn die API mal nichts liefert, nichts crashen:
  const { steps = [], calories = [], heartRates = [], weights = [] } =
    rawFit ? processFitData(rawFit) : { steps: [], calories: [], heartRates: [], weights: [] };

  const sleep = rawSleep
    ? processSleepData(rawSleep.point ?? []).map((e) => ({
        timestamp: e.wakeTimestamp,
        value: e.totalSleepHours,
      }))
    : [];

  // 2) Speichern (überschreibt die TTLs → frischer Stand)
  const jobs: Promise<any>[] = [];
  if (selected.steps)     jobs.push(saveFitDataToPod(session, podBaseUrl, "steps.ttl", "steps", steps));
  if (selected.calories)  jobs.push(saveFitDataToPod(session, podBaseUrl, "calories.ttl", "calories", calories));
  if (selected.heartRate) jobs.push(saveFitDataToPod(session, podBaseUrl, "heartRates.ttl", "heartRate", heartRates));
  if (selected.weight)    jobs.push(saveFitDataToPod(session, podBaseUrl, "weight.ttl", "weight", weights));
  if (selected.sleep)     jobs.push(saveFitDataToPod(session, podBaseUrl, "sleep.ttl", "sleepHours", sleep));

  await Promise.all(jobs);
}
