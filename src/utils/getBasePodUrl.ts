import { getPodUrlAll } from "@inrupt/solid-client";

function normalizeBase(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function derivePodFromWebId(webId: string): string {
  const url = new URL(webId);

  const pathname = url.pathname.replace(/\/+$/, "");

  // Fall 1:
  // https://provider.example/alice/profile/card#me
  // -> https://provider.example/alice/
  if (pathname.endsWith("/profile/card")) {
    const podPath = pathname.slice(0, -"/profile/card".length);
    return normalizeBase(`${url.origin}${podPath}`);
  }

  // Fall 2:
  // allgemeiner Fallback: ersten Pfadteil als Pod annehmen
  // /alice/profile/card  -> /alice/
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 0) {
    return normalizeBase(`${url.origin}/${segments[0]}`);
  }

  // letzter Fallback
  return normalizeBase(url.origin);
}

export async function getBasePodUrl(
  webId: string,
  fetcher: typeof fetch
): Promise<string> {
  try {
    const podUrls = await getPodUrlAll(webId, { fetch: fetcher });

    if (podUrls && podUrls.length > 0) {
      console.log("Pod URLs from profile:", podUrls);
      return normalizeBase(podUrls[0]);
    }

    console.warn(
      "No pod URL found via getPodUrlAll(). Falling back to WebID-derived base.",
      webId
    );

    return derivePodFromWebId(webId);
  } catch (err) {
    console.warn(
      "getPodUrlAll() failed. Falling back to WebID-derived base.",
      err
    );
    return derivePodFromWebId(webId);
  }
}