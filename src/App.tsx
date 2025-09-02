// src/App.tsx
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
import { DEFAULT_SELECTION, scopesFromSelection, MetricKey } from "./auth/fitScopes";
import "./auth.css";

const fileUrl = (base: string, name: string) => `${base}fit/${name}`;

const METRIC_FILE: Record<MetricKey, string> = {
  steps: "steps.ttl",
  calories: "calories.ttl",
  sleep: "sleep.ttl",
  heartRate: "heartRates.ttl",
  weight: "weight.ttl",
};

export default function App() {
  // Auth / Session
  const [webId, setWebId] = useState<string | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [podBaseUrl, setPodBaseUrl] = useState<string | null>(null);

  // Daten 
  const [steps, setSteps] = useState<TimePoint[]>([]);
  const [calories, setCalories] = useState<TimePoint[]>([]);
  const [sleep, setSleep] = useState<TimePoint[]>([]);
  const [heartRates, setHeartRates] = useState<TimePoint[]>([]);
  const [weight, setWeight] = useState<TimePoint[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("health");

  // Nutzer-Auswahl (persistiert) 
  const [metricSel, setMetricSel] = useState<Partial<Record<MetricKey, boolean>>>(() => {
    try {
      const raw = localStorage.getItem("fitMetricSel");
      return raw ? JSON.parse(raw) : DEFAULT_SELECTION;
    } catch {
      return DEFAULT_SELECTION;
    }
  });

  // Google-Scopes (abhängig von Auswahl)
  const [scopeStr, setScopeStr] = useState<string>(() => scopesFromSelection(metricSel));

  //  Session wiederherstellen 
  useEffect(() => {
    (async () => {
      await handleIncomingRedirect({ restorePreviousSession: true });
      const session = getDefaultSession();

      if (session.info.isLoggedIn && session.info.webId) {
        const w = session.info.webId;
        const base = getBasePodUrl(w);
        setWebId(w);
        setPodBaseUrl(base);

        const savedToken = localStorage.getItem("googleToken");
        if (savedToken) {
          setGoogleToken(savedToken);
          try {
            // bei App-Start frisch syncen und danach TTLs laden
            await syncGoogleToPod(base, savedToken, metricSel);
          } catch (e) {
            console.warn("Start-Sync fehlgeschlagen:", e);
          }
          await loadAll(base, metricSel);
        }
        // Wenn kein Google-Token existiert, greifen später die Guards und zeigen GoogleConnectScreen.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //  1) Sync triggern, sobald alles bereit ist ( nach Google-Login) 
  useEffect(() => {
    if (!webId || !podBaseUrl || !googleToken) return;
    (async () => {
      try {
        await syncGoogleToPod(podBaseUrl, googleToken, metricSel);
      } catch (e) {
        console.warn("Sync nach Login fehlgeschlagen:", e);
      }
      await loadAll(podBaseUrl, metricSel);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webId, podBaseUrl, googleToken]);

  // Daten laden 
  const loadAll = async (
    baseUrl: string,
    sel: Partial<Record<MetricKey, boolean>> = metricSel
  ) => {
    const [s, c, sl, hr, wg] = await Promise.all([
      sel.steps
        ? loadFitDataFromPod(fileUrl(baseUrl, "steps.ttl"), "steps")
        : Promise.resolve([]),
      sel.calories
        ? loadFitDataFromPod(fileUrl(baseUrl, "calories.ttl"), "calories")
        : Promise.resolve([]),
      sel.sleep
        ? loadFitDataFromPod(fileUrl(baseUrl, "sleep.ttl"), "sleepHours").catch(() => [])
        : Promise.resolve([]),
      sel.heartRate
        ? loadFitDataFromPod(fileUrl(baseUrl, "heartRates.ttl"), "heartRate").catch(() => [])
        : Promise.resolve([]),
      sel.weight
        ? loadFitDataFromPod(fileUrl(baseUrl, "weight.ttl"), "weight").catch(() => [])
        : Promise.resolve([]),
    ]);
    setSteps(s); setCalories(c); setSleep(sl); setHeartRates(hr); setWeight(wg);
  };

  // Solid Login / Logout 
  const handleLogin = async (issuerInput?: string) => {
    const issuer =
      issuerInput && issuerInput.trim().length > 0
        ? issuerInput.trim()
        : "https://solidcommunity.net";
    await login({
      oidcIssuer: issuer,
      redirectUrl: window.location.origin + "/", 
      clientName: "Solid Health App",
    });
  };

  const handleLogout = async () => {
    await getDefaultSession().logout();
    setWebId(null);
    setPodBaseUrl(null);
    setGoogleToken(null);
    localStorage.removeItem("googleToken");
  };

  // Google Login (Scopes kommen aus scopeStr) 
  const loginWithGoogle = useGoogleLogin({
    scope: scopeStr,
    onSuccess: async (resp) => {
      const token = resp.access_token;
      setGoogleToken(token);
      localStorage.setItem("googleToken", token);
      localStorage.setItem("fitMetricSel", JSON.stringify(metricSel));

      if (podBaseUrl) {
        await syncGoogleToPod(podBaseUrl, token, metricSel);
        await loadAll(podBaseUrl, metricSel);
      }
    },
    onError: (err) => console.error("Google Login Fehler:", err),
  });

  // Metrikdatei aus dem Pod löschen 
  const deleteMetricFromPod = async (metric: MetricKey) => {
    if (!podBaseUrl) return;
    const url = fileUrl(podBaseUrl, METRIC_FILE[metric]);
    await deleteFile(url, { fetch: getDefaultSession().fetch });

    // Auswahl deaktivieren --> Kachel verschwindet sofort
    setMetricSel((prev) => {
      const next = { ...prev, [metric]: false };
      localStorage.setItem("fitMetricSel", JSON.stringify(next));
      return next;
    });

    switch (metric) {
      case "steps": setSteps([]); break;
      case "calories": setCalories([]); break;
      case "sleep": setSleep([]); break;
      case "heartRate": setHeartRates([]); break;
      case "weight": setWeight([]); break;
    }
  };

  //  Google trennen 
  const disconnectGoogle = async () => {
    setGoogleToken(null);
    localStorage.removeItem("googleToken");
  };

  // Google-Scopes ändern und Flow starten 
  const startGoogleLoginWith = (sel: Partial<Record<MetricKey, boolean>>) => {
    setMetricSel(sel);
    localStorage.setItem("fitMetricSel", JSON.stringify(sel));
    const s = scopesFromSelection(sel);
    setScopeStr(s);
    setTimeout(() => loginWithGoogle(), 0);
  };

  // Screens
  if (!webId) {
    // Nutzer ist noch nicht bei Solid eingeloggt → LoginScreen
    return <LoginScreen onSolidLogin={handleLogin} />;
  }

  if (webId && !googleToken) {
    // Solid ok, Google fehlt → sofort Scopes/Verbinden zeigen
    return (
      <GoogleConnectScreen
        initial={metricSel}
        onCancel={handleLogout}
        onConfirm={startGoogleLoginWith}
      />
    );
  }

  // Haupt-App 
  return (
    <BrowserRouter>
      <div className="app-shell">
        <h1 className="app-title">Solid Health App</h1>

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
