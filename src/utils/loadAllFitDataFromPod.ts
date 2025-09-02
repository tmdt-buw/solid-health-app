// src/utils/loadAllFitDataFromPod.ts
import {
  getSolidDataset,
  getContainedResourceUrlAll,
  getThingAll,
  getStringNoLocale,
} from "@inrupt/solid-client";
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";

const NS = "http://example.org/health#";

export async function loadAllFitDataFromPod(folderUrl: string) {
  const session = getDefaultSession();
  const fitData: Array<{ file: string; date?: string; value?: string }> = [];

  const dataset = await getSolidDataset(folderUrl, { fetch: session.fetch });
  const containedUrls = getContainedResourceUrlAll(dataset);

  // alle .ttl im Ordner
  const ttlFiles = containedUrls.filter((url) => url.endsWith(".ttl"));

  for (const fileUrl of ttlFiles) {
    const fileDataset = await getSolidDataset(fileUrl, { fetch: session.fetch });
    const things = getThingAll(fileDataset);

    things.forEach((thing) => {
      fitData.push({
        file: fileUrl,
        date:
          getStringNoLocale(thing, `${NS}date`) ??
          getStringNoLocale(thing, "http://schema.org/startTime") ??
          undefined,
        value:
          getStringNoLocale(thing, `${NS}steps`) ?? 
          getStringNoLocale(thing, `${NS}calories`) ??
          getStringNoLocale(thing, `${NS}sleepHours`) ??
          getStringNoLocale(thing, "http://schema.org/value") ??
          undefined,
      });
    });
  }

  return fitData;
}
