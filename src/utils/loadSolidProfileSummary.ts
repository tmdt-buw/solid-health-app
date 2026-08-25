import {
  getSolidDataset,
  getStringByLocaleAll,
  getStringEnglish,
  getStringNoLocale,
  getThing,
  getThingAll,
  getUrl,
} from "@inrupt/solid-client";

const FOAF_NAME = "http://xmlns.com/foaf/0.1/name";
const FOAF_IMG = "http://xmlns.com/foaf/0.1/img";
const VCARD_FN = "http://www.w3.org/2006/vcard/ns#fn";
const VCARD_HAS_PHOTO = "http://www.w3.org/2006/vcard/ns#hasPhoto";
const VCARD_VALUE = "http://www.w3.org/2006/vcard/ns#value";
const VCARD_URL = "http://www.w3.org/2006/vcard/ns#url";

export type SolidProfileSummary = {
  name: string;
  photoUrl?: string;
};

const readProfileString = (
  profile: NonNullable<ReturnType<typeof getThing>>,
  predicate: string
): string => {
  const direct =
    getStringNoLocale(profile, predicate) || getStringEnglish(profile, predicate);
  if (direct) return direct;
  let localizedValue = "";
  getStringByLocaleAll(profile, predicate).forEach((localized) => {
    if (!localizedValue && localized[0]) localizedValue = localized[0];
  });
  return localizedValue;
};

export async function loadSolidProfileSummary(
  webId: string,
  fetcher: typeof fetch
): Promise<SolidProfileSummary> {
  const fallback: SolidProfileSummary = { name: "Solid User" };
  try {
    const dataset = await getSolidDataset(webId.split("#")[0], { fetch: fetcher });
    const profile =
      getThing(dataset, webId) ||
      getThingAll(dataset).find((thing) => thing.url === webId);
    if (!profile) return fallback;

    const name =
      readProfileString(profile, FOAF_NAME) || readProfileString(profile, VCARD_FN);
    const photoReference =
      getUrl(profile, VCARD_HAS_PHOTO) || getUrl(profile, FOAF_IMG) || "";
    const photoThing = photoReference ? getThing(dataset, photoReference) : null;
    const photoUrl = photoThing
      ? getUrl(photoThing, VCARD_VALUE) || getUrl(photoThing, VCARD_URL) || photoReference
      : photoReference;

    return {
      name: name || fallback.name,
      ...(photoUrl ? { photoUrl } : {}),
    };
  } catch {
    return fallback;
  }
}
