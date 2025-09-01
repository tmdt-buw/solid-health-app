import { deleteFile } from "@inrupt/solid-client";
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";
import { MetricKey, metricFileName } from "./metricFiles";

export async function deleteMetricFile(podBaseUrl: string, metric: MetricKey) {
  const url = `${podBaseUrl}fit/${metricFileName[metric]}`;
  try {
    await deleteFile(url, { fetch: getDefaultSession().fetch });
    console.log("✅ gelöscht:", url);
  } catch (e: any) {
    if (e?.statusCode === 404) {
      console.log("ℹ️ Datei nicht vorhanden:", url);
      return;
    }
    throw e;
  }
}
