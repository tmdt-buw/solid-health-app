import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export const SUPPORTED_LANGUAGES = ["en", "de"];
export const DEFAULT_LANGUAGE = "en";
export const LANGUAGE_STORAGE_KEY = "solid-dataspace.language";
export const LANGUAGE_EVENT = "solid-dataspace-language-change";
export const LANGUAGE_MESSAGE_TYPE = "solid-dataspace-language-change";

const enToDe = {
  Language: "Sprache",
  English: "Englisch",
  German: "Deutsch",
  Login: "Anmelden",
  Logout: "Abmelden",
  Save: "Speichern",
  Cancel: "Abbrechen",
  Close: "Schließen",
  Delete: "Löschen",
  Confirm: "Bestätigen",
  Connected: "Verbunden",
  "Loading...": "Wird geladen...",
  "Solid Health App": "Solid Gesundheits-App",
  "Solid login is managed by Solid Dataspace": "Die Solid-Anmeldung wird von Solid Dataspace verwaltet",
  "Please log in in the main Solid Dataspace application. This app will automatically reuse the same Solid session.":
    "Bitte melde dich in der Hauptanwendung Solid Dataspace an. Diese App nutzt automatisch dieselbe Solid-Sitzung.",
  "Provider detected, but Pod URL could not be resolved":
    "Anbieter erkannt, aber Pod-URL konnte nicht ermittelt werden",
  "Solid login was detected, but the Pod URL could not be determined for this provider.":
    "Eine Solid-Anmeldung wurde erkannt, aber die Pod-URL konnte für diesen Anbieter nicht ermittelt werden.",
  "Solid OIDC Login": "Solid-OIDC-Anmeldung",
  "Enter a valid OIDC issuer or Pod URL.": "Gib einen gültigen OIDC-Issuer oder eine Pod-URL ein.",
  "Back to provider list": "Zurück zur Anbieter-Liste",
  "Log in with selected provider": "Mit ausgewähltem Anbieter anmelden",
  "Choose your Solid Pod provider": "Wähle deinen Solid-Pod-Anbieter",
  "No Solid Pod yet?": "Noch kein Solid-Pod?",
  Recommended: "Empfohlen",
  "Public community server": "Öffentlicher Community-Server",
  "Example using the": "Beispiel mit dem",
  Visit: "Besuche",
  Click: "Klicke auf",
  "or any other Solid Pod Provider.": "oder einen anderen Solid-Pod-Anbieter.",
  Register: "Registrieren",
  "to create your account.": "um dein Konto zu erstellen.",
  "Log in and choose a name to create your Pod.":
    "Melde dich an und wähle einen Namen, um deinen Pod zu erstellen.",
  "Come back here, pick the provider and sign in with your new Pod.":
    "Kehre hierher zurück, wähle den Anbieter aus und melde dich mit deinem neuen Pod an.",
  "Suggested providers": "Vorgeschlagene Anbieter",
  "Pick a card or use \"Custom issuer\" below":
    "Wähle eine Karte oder nutze unten \"Eigener Issuer\"",
  "Custom issuer": "Eigener Issuer",
  "OIDC issuer URL of your Pod provider": "OIDC-Issuer-URL deines Pod-Anbieters",
  "Connect Google Fit": "Google Fit verbinden",
  "Choose which health metrics may be synchronized and stored in your Solid Pod.":
    "Wähle, welche Gesundheitsmetriken synchronisiert und in deinem Solid-Pod gespeichert werden dürfen.",
  "Pod storage": "Pod-Speicher",
  "Solid Health App will create this folder if it does not exist and store the selected Google Fit data there.":
    "Solid Health App erstellt diesen Ordner, falls er nicht existiert, und speichert dort die ausgewählten Google-Fit-Daten.",
  "I agree that Solid Health App may create the health/ folder in my Solid Pod and store the selected metrics there.":
    "Ich stimme zu, dass Solid Health App den Ordner health/ in meinem Solid-Pod erstellen und die ausgewählten Metriken dort speichern darf.",
  Connect: "Verbinden",
  "Select Google Fit data": "Google-Fit-Daten auswählen",
  "Disconnect Google Fit? New data will no longer be synchronized.":
    "Google Fit trennen? Neue Daten werden nicht mehr synchronisiert.",
  "Solid Logout": "Solid abmelden",
  "Google Logout": "Google abmelden",
  "Delete data": "Daten löschen",
  Steps: "Schritte",
  Calories: "Kalorien",
  Sleep: "Schlaf",
  "Heart rate": "Herzfrequenz",
  Weight: "Gewicht",
  "from Google Fit": "aus Google Fit",
  "Your name": "Dein Name",
  "Change profile picture": "Profilbild ändern",
};

Object.assign(enToDe, {
  Health: "Gesundheit",
  Me: "Ich",
  "WebID:": "WebID:",
  Age: "Alter",
  Avatar: "Avatar",
  "Avg calories (7d)": "Ø Kalorien (7 T.)",
  "Avg sleep (7d)": "Ø Schlaf (7 T.)",
  "Avg steps (7d)": "Ø Schritte (7 T.)",
  Height: "Größe",
  "Height (cm)": "Größe (cm)",
  "Latest heart rate": "Letzte Herzfrequenz",
  "Personal profile": "Persönliches Profil",
  Photo: "Foto",
  "Solid WebID": "Solid-WebID",
  "Weight (kg)": "Gewicht (kg)",
  Day: "Tag",
  Week: "Woche",
  Month: "Monat",
  "Last 90 days": "Letzte 90 Tage",
  "Disconnect Google": "Google trennen",
});

const deToEn = Object.entries(enToDe).reduce((acc, [en, de]) => {
  acc[de] = en;
  return acc;
}, {});

function withOriginalWhitespace(original, translated) {
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

export function normalizeLanguage(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.startsWith("de")) return "de";
  if (normalized.startsWith("en")) return "en";
  return DEFAULT_LANGUAGE;
}

function getLanguageFromUrl() {
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("lang") || params.get("language");
    return value ? normalizeLanguage(value) : "";
  } catch {
    return "";
  }
}

function getLanguageFromHostBridge() {
  if (typeof window === "undefined" || window.parent === window) return "";
  try {
    if (window.parent.location.origin !== window.location.origin) return "";
    const value = window.parent.__SOLID_DATASPACE_AUTH__?.getLanguage?.();
    return value ? normalizeLanguage(value) : "";
  } catch {
    return "";
  }
}

function readStoredLanguage() {
  if (typeof window === "undefined") return "";
  try {
    const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return value ? normalizeLanguage(value) : "";
  } catch {
    return "";
  }
}

function writeStoredLanguage(language) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(language));
  } catch {
    // Ignore storage failures.
  }
}

function resolveInitialLanguage() {
  return (
    getLanguageFromUrl() ||
    getLanguageFromHostBridge() ||
    readStoredLanguage() ||
    DEFAULT_LANGUAGE
  );
}

export function translateText(value, language) {
  if (typeof value !== "string" || !value.trim()) return value;
  const body = value.trim();
  const target = normalizeLanguage(language);
  if (target === "de") {
    return enToDe[body] ? withOriginalWhitespace(value, enToDe[body]) : value;
  }
  return deToEn[body] ? withOriginalWhitespace(value, deToEn[body]) : value;
}

function translateNode(node, language) {
  if (!node) return;
  if (node.nodeType === Node.TEXT_NODE) {
    const next = translateText(node.nodeValue || "", language);
    if (next !== node.nodeValue) node.nodeValue = next;
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  if (["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA"].includes(node.tagName)) {
    return;
  }
  ["title", "placeholder", "aria-label", "alt"].forEach((name) => {
    if (!node.hasAttribute?.(name)) return;
    const current = node.getAttribute(name);
    const next = translateText(current, language);
    if (next !== current) node.setAttribute(name, next);
  });
  node.childNodes.forEach((child) => translateNode(child, language));
}

function applyDocumentTranslations(language) {
  if (typeof document === "undefined" || !document.body) return;
  document.documentElement.lang = normalizeLanguage(language);
  translateNode(document.body, language);
}

function installDomTranslator(getLanguage) {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return () => {};
  }
  let scheduled = false;
  const run = () => {
    scheduled = false;
    applyDocumentTranslations(getLanguage());
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(run);
  };
  const observer = new MutationObserver(schedule);
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["title", "placeholder", "aria-label", "alt"],
    });
    schedule();
  }
  return () => observer.disconnect();
}

function publishLanguage(language) {
  if (typeof window === "undefined") return;
  const normalized = normalizeLanguage(language);
  writeStoredLanguage(normalized);
  window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: { language: normalized } }));
  try {
    window.parent?.postMessage({ type: LANGUAGE_MESSAGE_TYPE, language: normalized }, "*");
  } catch {
    // Ignore cross-window failures.
  }
  try {
    window.parent?.__SOLID_DATASPACE_AUTH__?.setLanguage?.(normalized);
  } catch {
    // Ignore bridge failures.
  }
}

function subscribeLanguage(callback) {
  if (typeof window === "undefined") return () => {};
  const handleEvent = (event) => callback(normalizeLanguage(event?.detail?.language));
  const handleStorage = (event) => {
    if (event.key === LANGUAGE_STORAGE_KEY && event.newValue) {
      callback(normalizeLanguage(event.newValue));
    }
  };
  const handleMessage = (event) => {
    const data = event.data || {};
    if (data.type === LANGUAGE_MESSAGE_TYPE && data.language) {
      callback(normalizeLanguage(data.language));
    }
  };
  let unsubscribeBridge;
  try {
    unsubscribeBridge = window.parent?.__SOLID_DATASPACE_AUTH__?.subscribeLanguage?.(callback);
  } catch {
    unsubscribeBridge = undefined;
  }
  window.addEventListener(LANGUAGE_EVENT, handleEvent);
  window.addEventListener("storage", handleStorage);
  window.addEventListener("message", handleMessage);
  return () => {
    window.removeEventListener(LANGUAGE_EVENT, handleEvent);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("message", handleMessage);
    unsubscribeBridge?.();
  };
}

const I18nContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (value) => value,
});

export function I18nProvider({ children, language: controlledLanguage }) {
  const [internalLanguage, setInternalLanguage] = useState(resolveInitialLanguage);
  const language = normalizeLanguage(controlledLanguage || internalLanguage);
  const languageRef = useRef(language);
  languageRef.current = language;

  const setLanguage = useCallback(
    (nextLanguage) => {
      const normalized = normalizeLanguage(nextLanguage);
      if (!controlledLanguage) setInternalLanguage(normalized);
      publishLanguage(normalized);
    },
    [controlledLanguage]
  );

  useEffect(() => {
    applyDocumentTranslations(language);
  }, [language]);

  useEffect(() => installDomTranslator(() => languageRef.current), []);

  useEffect(
    () =>
      subscribeLanguage((nextLanguage) => {
        if (nextLanguage === languageRef.current) return;
        if (!controlledLanguage) setInternalLanguage(nextLanguage);
      }),
    [controlledLanguage]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key) => translateText(key, language),
    }),
    [language, setLanguage]
  );

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageSelect({ className = "", compact = false, label = "" } = {}) {
  const { language, setLanguage, t } = useI18n();
  return React.createElement(
    "label",
    { className: `language-select ${className}`.trim() },
    !compact &&
      React.createElement(
        "span",
        { className: "language-select__label" },
        label || t("Language")
      ),
    React.createElement(
      "select",
      {
        value: language,
        onChange: (event) => setLanguage(event.target.value),
        "aria-label": t("Language"),
        title: t("Language"),
      },
      React.createElement(
        "option",
        { value: "en" },
        language === "de" ? "Englisch" : "English"
      ),
      React.createElement("option", { value: "de" }, "Deutsch")
    )
  );
}
