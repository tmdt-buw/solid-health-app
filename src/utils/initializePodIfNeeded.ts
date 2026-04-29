import { getDefaultSession } from "@inrupt/solid-client-authn-browser";
import { ensureHealthFolderExists } from "./ensureHealthFolderExists";
import { saveFitDataToPod } from "./saveFitDataToPod";
import { fetchGeneralFitData } from "../services/googleFit/fetchGeneralFitData";
import { fetchSleepData } from "../services/googleFit/fetchSleepData";
import { processFitData } from "../services/googleFit/processFitData";
import { processSleepData } from "../services/googleFit/processSleepData";
import { MetricKey } from "../auth/fitScopes";

const fileUrl = (base: string, name: string) => `${base}health/${name}`;

export async function initializePodIfNeeded(
  podBaseUrl: string,
  googleToken: string,
  selected: Partial<Record<MetricKey, boolean>>,
  seedIfMissing: boolean
) {
  const fetcher = getDefaultSession().fetch;
  await ensureHealthFolderExists(podBaseUrl, fetcher);


if (seedIfMissing) {
  try {
    const rawFit = await fetchGeneralFitData(googleToken);
    const rawSleep = selected.sleep ? await fetchSleepData(googleToken) : { point: [] };

    const { steps, calories, heartRates, weights } = processFitData(rawFit);
    const sleep = processSleepData(rawSleep?.point ?? []).map(e => ({
      timestamp: e.wakeTimestamp,
      value: e.totalSleepHours,
    }));

    const jobs: Promise<any>[] = [];
    if (selected.steps)     jobs.push(saveFitDataToPod(fetcher, podBaseUrl, "steps.ttl", "steps", steps));
    if (selected.calories)  jobs.push(saveFitDataToPod(fetcher, podBaseUrl, "calories.ttl", "calories", calories));
    if (selected.heartRate) jobs.push(saveFitDataToPod(fetcher, podBaseUrl, "heartRates.ttl", "heartRate", heartRates));
    if (selected.weight)    jobs.push(saveFitDataToPod(fetcher, podBaseUrl, "weight.ttl", "weight", weights));
    if (selected.sleep)     jobs.push(saveFitDataToPod(fetcher, podBaseUrl, "sleep.ttl", "sleepHours", sleep));

    await Promise.all(jobs);
  } catch (e) {
    console.warn("Seeding übersprungen wegen Fehler:", e);
  }
}

}
