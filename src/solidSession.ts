import {
  Session,
  handleIncomingRedirect,
} from "@inrupt/solid-client-authn-browser";

const STORAGE_PREFIX = "solid-health-app:";
const storageKey = (key: string) => `${STORAGE_PREFIX}${key}`;

const sessionStorageWrapper = {
  get: async (key: string) =>
    typeof window === "undefined"
      ? undefined
      : window.sessionStorage.getItem(storageKey(key)) ?? undefined,
  set: async (key: string, value: string) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey(key), value);
    }
  },
  delete: async (key: string) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(storageKey(key));
    }
  },
};

type SolidSessionLike = InstanceType<typeof Session> & {
  handleIncomingRedirect?: (
    options?: string | { url?: string; restorePreviousSession?: boolean }
  ) => Promise<unknown>;
};

let currentSession: SolidSessionLike = new Session(
  {
    secureStorage: sessionStorageWrapper,
    insecureStorage: sessionStorageWrapper,
  },
  "solid-health-app"
);

export function setSession(nextSession: SolidSessionLike) {
  if (!nextSession) return;
  currentSession = nextSession;
}

export async function restoreSession() {
  if (typeof window === "undefined") return;

  if (typeof currentSession.handleIncomingRedirect === "function") {
    await currentSession.handleIncomingRedirect({
      url: window.location.href,
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
