import { useEffect, useState } from "react";
import {
  login,
  handleIncomingRedirect,
  getDefaultSession,
} from "@inrupt/solid-client-authn-browser";
import { deleteFile } from "@inrupt/solid-client";
import { useGoogleLogin } from "@react-oauth/google";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import CardDashboard from "./components/CardDashboard";
import BottomNav, { Tab } from "./components/BottomNav";
import MePanel from "./components/MePanel";
import LoginScreen from "./components/LoginScreen";
import MetricDetail from "./components/MetricDetail";
import GoogleConnectScreen from "./components/GoogleConnectScreen";

import { loadFitDataFromPod, TimePoint } from "./utils/loadFitDataFromPod";
import { getBasePodUrl } from "./utils/getBasePodUrl";
import { syncGoogleToPod } from "./utils/syncGoogleToPod";
import {
  DEFAULT_SELECTION,
  scopesFromSelection,
  MetricKey,
} from "./auth/fitScopes";
import { appVersion } from "./version";
import "./auth.css";

const AUTH_BRIDGE_KEY = "__SOLID_DATASPACE_AUTH__";

type SolidFetch = typeof fetch;

type BridgeState = {
  isLoggedIn: boolean;
  webId: string | null;
};

type HostAuthBridge = {
  source?: string;
  version?: number;
  isReady?: boolean;
  getState: () => BridgeState;
  getFetch: () => SolidFetch;
  subscribe?: (callback: (state: BridgeState) => void) => () => void;
  login?: (issuer?: string) => Promise<void>;
  logout?: () => Promise<void>;
};

const fileUrl = (base: string, name: string) => `${base}health/${name}`;

const METRIC_FILE: Record<MetricKey, string> = {
  steps: "steps.ttl",
  calories: "calories.ttl",
  sleep: "sleep.ttl",
  heartRate: "heartRates.ttl",
  weight: "weight.ttl",
};

function getHostBridge(): HostAuthBridge | null {
  if (typeof window === "undefined") return null;
  if (window.parent === window) return null;

  try {
    if (window.parent.location.origin !== window.location.origin) {
      return null;
    }

    const bridge = (window.parent as any)[AUTH_BRIDGE_KEY] as HostAuthBridge | undefined;
    return bridge?.isReady ? bridge : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [webId, setWebId] = useState<string | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [podBaseUrl, setPodBaseUrl] = useState<string | null>(null);
  const [solidFetch, setSolidFetch] = useState<SolidFetch | null>(null);
  const [embeddedMode, setEmbeddedMode] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);

  const [steps, setSteps] = useState<TimePoint[]>([]);
  const [calories, setCalories] = useState<TimePoint[]>([]);
  const [sleep, setSleep] = useState<TimePoint[]>([]);
  const [heartRates, setHeartRates] = useState<TimePoint[]>([]);
  const [weight, setWeight] = useState<TimePoint[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("health");

  const [metricSel, setMetricSel] = useState<Partial<Record<MetricKey, boolean>>>(() => {
    try {
      const raw = localStorage.getItem("fitMetricSel");
      return raw ? JSON.parse(raw) : DEFAULT_SELECTION;
    } catch {
      return DEFAULT_SELECTION;
    }
  });

  const [scopeStr, setScopeStr] = useState<string>(() => scopesFromSelection(metricSel));

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    const applyAuthState = async (state: BridgeState, fetcher?: SolidFetch) => {
      if (disposed) return;

      if (state.isLoggedIn && state.webId && fetcher) {
        setWebId(state.webId);
        setSolidFetch(() => fetcher);
        setProviderError(null);

        try {
          const base = await getBasePodUrl(state.webId, fetcher);
          if (disposed) return;

          console.log("Resolved pod base URL:", base);
          setPodBaseUrl(base);

          const savedToken = localStorage.getItem("googleToken");
          if (savedToken) {
            setGoogleToken(savedToken);
          }
        } catch (err) {
          console.error("Failed to resolve Pod URL:", err);
          setPodBaseUrl(null);
          setProviderError(
            "Solid login was detected, but the Pod URL could not be determined for this provider."
          );
        }

        return;
      }

      setWebId(null);
      setPodBaseUrl(null);
      setSolidFetch(null);
      setProviderError(null);
    };

    const boot = async () => {
      const bridge = getHostBridge();

      if (bridge) {
        setEmbeddedMode(true);
        await applyAuthState(bridge.getState(), bridge.getFetch());

        unsubscribe = bridge.subscribe?.((state) => {
          applyAuthState(state, bridge.getFetch());
        });
        return;
      }

      setEmbeddedMode(false);

      await handleIncomingRedirect({ restorePreviousSession: true });
      const session = getDefaultSession();

      if (session.info.isLoggedIn && session.info.webId) {
        await applyAuthState(
          { isLoggedIn: true, webId: session.info.webId },
          session.fetch.bind(session)
        );
      }
    };

    boot();

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);

  const loadAll = async (
    baseUrl: string,
    fetcher: SolidFetch,
    sel: Partial<Record<MetricKey, boolean>> = metricSel
  ) => {
    const [s, c, sl, hr, wg] = await Promise.all([
      sel.steps
        ? loadFitDataFromPod(fileUrl(baseUrl, "steps.ttl"), "steps", fetcher).catch(() => [])
        : Promise.resolve([]),
      sel.calories
        ? loadFitDataFromPod(fileUrl(baseUrl, "calories.ttl"), "calories", fetcher).catch(() => [])
        : Promise.resolve([]),
      sel.sleep
        ? loadFitDataFromPod(fileUrl(baseUrl, "sleep.ttl"), "sleepHours", fetcher).catch(() => [])
        : Promise.resolve([]),
      sel.heartRate
        ? loadFitDataFromPod(fileUrl(baseUrl, "heartRates.ttl"), "heartRate", fetcher).catch(() => [])
        : Promise.resolve([]),
      sel.weight
        ? loadFitDataFromPod(fileUrl(baseUrl, "weight.ttl"), "weight", fetcher).catch(() => [])
        : Promise.resolve([]),
    ]);

    setSteps(s);
    setCalories(c);
    setSleep(sl);
    setHeartRates(hr);
    setWeight(wg);
  };

  useEffect(() => {
    if (!webId || !podBaseUrl || !googleToken || !solidFetch) return;

    (async () => {
      try {
        await syncGoogleToPod(podBaseUrl, googleToken, metricSel, solidFetch);
      } catch (e) {
        console.warn("Sync after login failed:", e);
      }

      await loadAll(podBaseUrl, solidFetch, metricSel);
    })();
  }, [webId, podBaseUrl, googleToken, metricSel, solidFetch]);

  const handleLogin = async (issuerInput?: string) => {
    const issuer =
      issuerInput && issuerInput.trim().length > 0
        ? issuerInput.trim()
        : "https://solidcommunity.net";

    if (embeddedMode) {
      const bridge = getHostBridge();
      if (bridge?.login) {
        await bridge.login(issuer);
      }
      return;
    }

    await login({
      oidcIssuer: issuer,
      redirectUrl: `${window.location.origin}/solid-health-app/`,
      clientName: "Solid Health App",
    });
  };

  const handleLogout = async () => {
    localStorage.removeItem("googleToken");
    setGoogleToken(null);

    if (embeddedMode) {
      const bridge = getHostBridge();
      if (bridge?.logout) {
        await bridge.logout();
      }
      return;
    }

    await getDefaultSession().logout({ logoutType: "app" });
    setWebId(null);
    setPodBaseUrl(null);
    setSolidFetch(null);
    setProviderError(null);
  };

  const loginWithGoogle = useGoogleLogin({
    scope: scopeStr,
    onSuccess: async (resp) => {
      const token = resp.access_token;
      setGoogleToken(token);
      localStorage.setItem("googleToken", token);
      localStorage.setItem("fitMetricSel", JSON.stringify(metricSel));

      if (podBaseUrl && solidFetch) {
        await syncGoogleToPod(podBaseUrl, token, metricSel, solidFetch);
        await loadAll(podBaseUrl, solidFetch, metricSel);
      }
    },
    onError: (err) => console.error("Google login failed:", err),
  });

  const deleteMetricFromPod = async (metric: MetricKey) => {
    if (!podBaseUrl || !solidFetch) return;

    const url = fileUrl(podBaseUrl, METRIC_FILE[metric]);
    await deleteFile(url, { fetch: solidFetch });

    setMetricSel((prev) => {
      const next = { ...prev, [metric]: false };
      localStorage.setItem("fitMetricSel", JSON.stringify(next));
      return next;
    });

    switch (metric) {
      case "steps":
        setSteps([]);
        break;
      case "calories":
        setCalories([]);
        break;
      case "sleep":
        setSleep([]);
        break;
      case "heartRate":
        setHeartRates([]);
        break;
      case "weight":
        setWeight([]);
        break;
    }
  };

  const disconnectGoogle = async () => {
    setGoogleToken(null);
    localStorage.removeItem("googleToken");
  };

  const startGoogleLoginWith = (sel: Partial<Record<MetricKey, boolean>>) => {
    setMetricSel(sel);
    localStorage.setItem("fitMetricSel", JSON.stringify(sel));
    const s = scopesFromSelection(sel);
    setScopeStr(s);
    setTimeout(() => loginWithGoogle(), 0);
  };

  if (!webId) {
    if (embeddedMode) {
      return (
        <div className="auth-shell">
          <div className="auth-card">
            <h2>Solid login is managed by Solid Dataspace</h2>
            <p>
              Please log in in the main Solid Dataspace application.
              This app will automatically reuse the same Solid session.
            </p>
          </div>
        </div>
      );
    }

    return <LoginScreen onSolidLogin={handleLogin} />;
  }

  if (webId && !podBaseUrl && providerError) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h2>Provider detected, but Pod URL could not be resolved</h2>
          <p>{providerError}</p>
          <p>
            WebID: <strong>{webId}</strong>
          </p>
        </div>
      </div>
    );
  }

  if (webId && !googleToken) {
    return (
      <GoogleConnectScreen
        initial={metricSel}
        onCancel={handleLogout}
        onConfirm={startGoogleLoginWith}
      />
    );
  }

  return (
    <BrowserRouter basename="/solid-health-app">
      <div className={`app-shell${embeddedMode ? " app-shell--embedded" : ""}`}>
        {!embeddedMode && (
          <div className="app-topbar">
            <div className="app-topbar-left">
              <h1 className="app-topbar-title">Solid Health App</h1>
            </div>

            <div className="app-topbar-right">
              <span className="app-topbar-status">Connected</span>
              <span className="app-topbar-version">{appVersion}</span>
            </div>
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              activeTab === "health" && podBaseUrl ? (
                <CardDashboard
                  steps={steps}
                  calories={calories}
                  sleep={sleep}
                  heartRates={heartRates}
                  weight={weight}
                  allowed={metricSel}
                />
              ) : (
                <MePanel
                  webId={webId}
                  googleToken={googleToken}
                  onSolidLogout={handleLogout}
                  onGoogleLogout={disconnectGoogle}
                  steps={steps}
                  calories={calories}
                  sleep={sleep}
                  weight={weight}
                  heartRates={heartRates}
                />
              )
            }
          />

          <Route
            path="/detail/:metric"
            element={
              <MetricDetail
                dataMap={{ steps, calories, sleep, heartRate: heartRates, weight }}
                onDeleteMetric={deleteMetricFromPod}
                onDisconnectGoogle={disconnectGoogle}
              />
            }
          />
        </Routes>

        <BottomNav active={activeTab} onChange={setActiveTab} />
      </div>
    </BrowserRouter>
  );
}
