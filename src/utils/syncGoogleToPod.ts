import { saveFitDataToPod } from "./saveFitDataToPod";
import { ensureHealthFolderExists } from "./ensureHealthFolderExists";

import { fetchGeneralFitData } from "../services/googleFit/fetchGeneralFitData";
import { fetchSleepData } from "../services/googleFit/fetchSleepData";
import { processFitData } from "../services/googleFit/processFitData";
import { processSleepData } from "../services/googleFit/processSleepData";
import { MetricKey } from "../auth/fitScopes";

export async function syncGoogleToPod(
  podBaseUrl: string,
  googleToken: string,
  selected: Partial<Record<MetricKey, boolean>>,
  fetcher: typeof fetch
) {
  await ensureHealthFolderExists(podBaseUrl, fetcher);

  const rawFit = await fetchGeneralFitData(googleToken).catch(() => null);
  const rawSleep = selected.sleep
    ? await fetchSleepData(googleToken).catch(() => null)
    : null;

  const { steps = [], calories = [], heartRates = [], weights = [] } =
    rawFit
      ? processFitData(rawFit)
      : { steps: [], calories: [], heartRates: [], weights: [] };

  const sleep = rawSleep
    ? processSleepData(rawSleep.point ?? []).map((e) => ({
        timestamp: e.wakeTimestamp,
        value: e.totalSleepHours,
      }))
    : [];

  const jobs: Promise<any>[] = [];

  if (selected.steps) {
    jobs.push(
      saveFitDataToPod(fetcher, podBaseUrl, "steps.ttl", "steps", steps)
    );
  }

  if (selected.calories) {
    jobs.push(
      saveFitDataToPod(fetcher, podBaseUrl, "calories.ttl", "calories", calories)
    );
  }

  if (selected.heartRate) {
    jobs.push(
      saveFitDataToPod(fetcher, podBaseUrl, "heartRates.ttl", "heartRate", heartRates)
    );
  }

  if (selected.weight) {
    jobs.push(
      saveFitDataToPod(fetcher, podBaseUrl, "weight.ttl", "weight", weights)
    );
  }

  if (selected.sleep) {
    jobs.push(
      saveFitDataToPod(fetcher, podBaseUrl, "sleep.ttl", "sleepHours", sleep)
    );
  }

  await Promise.all(jobs);
}
