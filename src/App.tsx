import React, { useCallback, useEffect, useState } from "react";
import { deleteFile } from "@inrupt/solid-client";
import { useGoogleLogin } from "@react-oauth/google";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import CardDashboard from "./components/CardDashboard";
import BottomNav, { Tab } from "./components/BottomNav";
import MePanel from "./components/MePanel";
import LoginScreen from "./components/LoginScreen";
import MetricDetail from "./components/MetricDetail";
import GoogleConnectScreen from "./components/GoogleConnectScreen";
import StandaloneFooter from "./components/StandaloneFooter";
import StandaloneHeader from "./components/StandaloneHeader";
import EmbeddedRouterBoundary from "./embed/EmbeddedRouterBoundary";

import { loadFitDataFromPod, TimePoint } from "./utils/loadFitDataFromPod";
import { getBasePodUrl } from "./utils/getBasePodUrl";
import { syncGoogleToPod } from "./utils/syncGoogleToPod";
import {
  DEFAULT_SELECTION,
  scopesFromSelection,
  MetricKey,
} from "./auth/fitScopes";
import session, { restoreSession } from "./solidSession";
import { I18nProvider, LanguageSelect } from "./i18n";
import "./tmdt-theme.css";
import "./App.css";
import "./auth.css";
import "./LanguageSelect.css";
import "./standalone.css";

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
  getLanguage?: () => string;
  setLanguage?: (language: string) => Promise<void>;
  subscribeLanguage?: (callback: (language: string) => void) => () => void;
  subscribe?: (callback: (state: BridgeState) => void) => () => void;
  login?: (issuer?: string) => Promise<void>;
  logout?: () => Promise<void>;
};

type AppProps = {
  embedded?: boolean;
  webIdOverride?: string | null;
  language?: string | null;
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

export default function App({
  embedded = false,
  webIdOverride = null,
  language = null,
}: AppProps) {
  const [webId, setWebId] = useState<string | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [podBaseUrl, setPodBaseUrl] = useState<string | null>(null);
  const [solidFetch, setSolidFetch] = useState<SolidFetch | null>(null);
  const [embeddedMode, setEmbeddedMode] = useState(embedded);
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
    if (typeof document === "undefined") return;

    if (embedded) {
      document.body.classList.remove("solid-health-standalone");
      return;
    }

    document.body.classList.add("solid-health-standalone");

    return () => {
      document.body.classList.remove("solid-health-standalone");
    };
  }, [embedded]);

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
      const bridge = embedded ? null : getHostBridge();

      if (bridge) {
        setEmbeddedMode(true);
        await applyAuthState(bridge.getState(), bridge.getFetch());

        unsubscribe = bridge.subscribe?.((state) => {
          applyAuthState(state, bridge.getFetch());
        });
        return;
      }

      if (embedded) {
        setEmbeddedMode(true);
        const nextWebId = webIdOverride || session.info.webId || null;
        await applyAuthState(
          { isLoggedIn: Boolean(nextWebId), webId: nextWebId },
          session.fetch.bind(session)
        );
        return;
      }

      setEmbeddedMode(false);

      await restoreSession();

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
  }, [embedded, webIdOverride]);

  const loadAll = useCallback(async (
    baseUrl: string,
    fetcher: SolidFetch,
    sel: Partial<Record<MetricKey, boolean>>
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
  }, []);

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
  }, [webId, podBaseUrl, googleToken, metricSel, solidFetch, loadAll]);

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

    await session.login({
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

    await session.logout({ logoutType: "app" });
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

  const renderWithI18n = (content: React.ReactNode) => (
    <I18nProvider language={language}>
      <div
        className={`solid-health-app solid-health-app--${
          embeddedMode ? "embedded" : "standalone"
        }`}
      >
        {content}
      </div>
    </I18nProvider>
  );

  const standaloneFrame = (content: React.ReactNode) => (
    <div className="solid-health-standalone-frame">
      <StandaloneHeader
        webId={webId || ""}
        solidFetch={solidFetch || session.fetch.bind(session)}
        onLogout={handleLogout}
      />
      <main className="solid-health-standalone-main">{content}</main>
      <StandaloneFooter />
    </div>
  );

  if (!webId) {
    if (embeddedMode) {
      return renderWithI18n(
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

    return renderWithI18n(
      <LoginScreen
        onSolidLogin={handleLogin}
        languageControl={<LanguageSelect className="language-select--login" />}
      />
    );
  }

  if (webId && !podBaseUrl && providerError) {
    const providerErrorContent = (
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
    return renderWithI18n(
      embeddedMode ? providerErrorContent : standaloneFrame(providerErrorContent)
    );
  }

  if (webId && !googleToken) {
    const googleConnectContent = (
      <GoogleConnectScreen
        initial={metricSel}
        onCancel={handleLogout}
        onConfirm={startGoogleLoginWith}
      />
    );
    return renderWithI18n(
      embeddedMode ? googleConnectContent : standaloneFrame(googleConnectContent)
    );
  }

  const appContent = (
    <div className={`app-shell${embeddedMode ? " app-shell--embedded" : ""}`}>
        <Routes>
          <Route
            index
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
            path="detail/:metric"
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
  );

  if (embeddedMode) {
    return renderWithI18n(
      <EmbeddedRouterBoundary>{appContent}</EmbeddedRouterBoundary>
    );
  }

  return renderWithI18n(
    standaloneFrame(
      <BrowserRouter basename="/solid-health-app">{appContent}</BrowserRouter>
    )
  );
}
