import {
  getDefaultSession,
  handleIncomingRedirect,
} from "@inrupt/solid-client-authn-browser";

type SolidSessionLike = ReturnType<typeof getDefaultSession> & {
  handleIncomingRedirect?: (
    url?: string,
    options?: { restorePreviousSession?: boolean }
  ) => Promise<unknown>;
};

let currentSession: SolidSessionLike = getDefaultSession();

export function setSession(nextSession: SolidSessionLike) {
  if (!nextSession) return;
  currentSession = nextSession;
}

export async function restoreSession() {
  if (typeof window === "undefined") return;

  if (typeof currentSession.handleIncomingRedirect === "function") {
    await currentSession.handleIncomingRedirect(window.location.href, {
      restorePreviousSession: true,
    });
    return;
  }

  await handleIncomingRedirect({
    restorePreviousSession: true,
  });
}

export { currentSession as session };
export { currentSession as default };
