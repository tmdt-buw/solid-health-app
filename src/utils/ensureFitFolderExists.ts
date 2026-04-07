import { getResourceInfo, createContainerAt } from "@inrupt/solid-client";

export async function ensureFitFolderExists(
  podBaseUrl: string,
  fetcher: typeof fetch
) {
  const folderUrl = `${podBaseUrl}fit/`;

  try {
    await getResourceInfo(folderUrl, { fetch: fetcher });
    console.log("📁 'fit/' Ordner existiert bereits");
  } catch (e: any) {
    const status = e?.statusCode ?? e?.status;

    if (status === 404) {
      await createContainerAt(folderUrl, { fetch: fetcher });
      console.log("✅ 'fit/' Ordner neu erstellt");
    } else {
      console.error("❌ Fehler beim Erstellen des 'fit/' Ordners:", e);
      throw e;
    }
  }
}