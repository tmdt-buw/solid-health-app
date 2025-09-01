export const getBasePodUrl = (webId: string): string => {
  try {
    const url = new URL(webId);
    return `${url.protocol}//${url.hostname}/`;
  } catch (e) {
    console.error("Ungültige WebID:", webId);
    return "";
  }
};
