import { overwriteFile } from "@inrupt/solid-client";

const NS = "http://example.org/health#";

const getFileUrl = (podBaseUrl: string, filename: string) =>
  `${podBaseUrl}fit/${filename}`;

const daysAgoISO = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const filterLast90Days = (data: { timestamp: string; value: number }[]) => {
  const limit = new Date(daysAgoISO(90)).getTime();
  return data.filter((e) => new Date(e.timestamp).getTime() >= limit);
};

const generateTurtle = (
  data: { timestamp: string; value: number }[],
  predicate: string
) => {
  const header = [
    "@prefix ex: <http://example.org/health#> .",
    "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .",
    "",
  ].join("\n");

  const body = data
    .map(
      (entry, i) => `
<#e${i}>
  ex:date "${entry.timestamp}"^^xsd:dateTime ;
  ex:${predicate} "${entry.value}"^^xsd:float .
`.trim()
    )
    .join("\n\n");

  return `${header}\n${body}\n`;
};

export const saveFitDataToPod = async (
  fetcher: typeof fetch,
  podBaseUrl: string,
  filename: string,
  predicate: string,
  data: { timestamp: string; value: number }[]
) => {
  const fileUrl = getFileUrl(podBaseUrl, filename);
  const recentData = filterLast90Days(data);
  const turtle = generateTurtle(recentData, predicate);

  try {
    await overwriteFile(fileUrl, new Blob([turtle], { type: "text/turtle" }), {
      contentType: "text/turtle",
      fetch: fetcher,
    });
    console.log(`✅ ${filename} erfolgreich gespeichert (${recentData.length} Einträge).`);
  } catch (err: any) {
    console.error(`❌ Fehler beim Speichern von ${filename}:`, err?.message ?? err);
    throw err;
  }
};