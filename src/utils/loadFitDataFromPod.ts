import {
  getSolidDataset,
  getThingAll,
  getDatetime,
  getLiteral,
} from "@inrupt/solid-client";

export type TimePoint = { timestamp: string; value: number };

const NS = "http://example.org/health#";

export async function loadFitDataFromPod(
  fileUrl: string,
  predicate: string,
  fetcher: typeof fetch
): Promise<TimePoint[]> {
  const dataset = await getSolidDataset(fileUrl, {
    fetch: fetcher,
  });

  const things = getThingAll(dataset);
  const points: TimePoint[] = [];

  for (const thing of things) {
    const d = getDatetime(thing, `${NS}date`);
    if (!d) continue;

    const lit = getLiteral(thing, `${NS}${predicate}`);
    if (!lit) continue;

    const num = Number.parseFloat(lit.value);
    if (!Number.isFinite(num)) continue;

    points.push({ timestamp: d.toISOString(), value: num });
  }

  const byTs = new Map<string, number>();
  for (const p of points) byTs.set(p.timestamp, p.value);

  return Array.from(byTs.entries())
    .map(([timestamp, value]) => ({ timestamp, value }))
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
}