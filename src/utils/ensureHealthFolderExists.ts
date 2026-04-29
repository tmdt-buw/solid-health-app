import { getResourceInfo, createContainerAt } from "@inrupt/solid-client";

export async function ensureHealthFolderExists(
  podBaseUrl: string,
  fetcher: typeof fetch
) {
  const folderUrl = `${podBaseUrl}health/`;

  try {
    await getResourceInfo(folderUrl, { fetch: fetcher });
    console.log("'health/' folder already exists");
  } catch (e: any) {
    const status = e?.statusCode ?? e?.status;

    if (status === 404) {
      await createContainerAt(folderUrl, { fetch: fetcher });
      console.log("'health/' folder created");
    } else {
      console.error("Error creating 'health/' folder:", e);
      throw e;
    }
  }
}
