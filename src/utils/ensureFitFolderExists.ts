import { getResourceInfo, createContainerAt } from "@inrupt/solid-client";
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";

export async function ensureFitFolderExists(podBaseUrl: string) {
  const folderUrl = `${podBaseUrl}fit/`;

  try {
    await getResourceInfo(folderUrl, { fetch: getDefaultSession().fetch });
    console.log("📁 'fit/' Ordner existiert bereits");
  } catch (e: any) {
    if (e.statusCode === 404) {
      await createContainerAt(folderUrl, { fetch: getDefaultSession().fetch });
      console.log("✅ 'fit/' Ordner neu erstellt");
    } else {
      console.error("❌ Fehler beim Erstellen des 'fit/' Ordners:", e);
    }
  }
}

