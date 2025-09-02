// src/utils/googleRevoke.ts
export async function revokeGoogleToken(accessToken: string) {
  try {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: accessToken }),
    });
  } catch (e) {
    console.warn("Revoke fehlgeschlagen (ignoriert):", e);
  }
}
