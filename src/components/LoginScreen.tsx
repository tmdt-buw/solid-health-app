import React, { FormEvent, useMemo, useState } from "react";
import "../auth.css";
import FontAwesomeIcon from "./FontAwesomeIcon";
import LoginParticleCloud from "./LoginParticleCloud";

type Props = {
  onSolidLogin: (issuer?: string) => void | Promise<void>;
  languageControl?: React.ReactNode;
};

const PROVIDERS = [
  { label: "TMDT Solid", url: "https://solid-community-server.tmdt.info" },
  { label: "Solid Community", url: "https://solidcommunity.net" },
];

const normalizeIssuer = (value: string): string | null => {
  const candidate = value.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    const localHttp =
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      (url.protocol !== "https:" && !localHttp) ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.href.replace(/\/$/, "");
  } catch {
    return null;
  }
};

const LoginScreen: React.FC<Props> = ({ onSolidLogin, languageControl = null }) => {
  const [selected, setSelected] = useState(PROVIDERS[0].url);
  const [customIssuer, setCustomIssuer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const customValue = customIssuer.trim();
  const normalizedCustomIssuer = useMemo(
    () => (customValue ? normalizeIssuer(customValue) : null),
    [customValue]
  );
  const customIsInvalid = customValue.length > 0 && !normalizedCustomIssuer;
  const issuerToLogin = customValue ? normalizedCustomIssuer : selected;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!issuerToLogin || submitting) {
      if (!issuerToLogin) setError("Enter a valid OIDC issuer or Pod URL.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSolidLogin(issuerToLogin);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Solid login could not be started.");
      setSubmitting(false);
    }
  };

  return (
    <main className="solid-health-login">
      <div className="solid-health-login__stage">
        <section className="solid-health-login__shell" aria-labelledby="solid-health-login-title">
          <header className="solid-health-login__hero">
            <span className="solid-health-login__brand-icon" aria-hidden="true">
              <FontAwesomeIcon icon="heart-pulse" />
            </span>
            <h1 id="solid-health-login-title">Health App</h1>
          </header>

          <LoginParticleCloud label="Health App" />

          <form className="solid-health-login__card" onSubmit={submit} noValidate>
            <fieldset className="solid-health-login__fieldset" disabled={submitting}>
              <legend>Suggested providers</legend>
              <div className="solid-health-login__providers">
                {PROVIDERS.map((provider) => {
                  const active = !customValue && provider.url === selected;
                  return (
                    <button
                      key={provider.url}
                      type="button"
                      className={`solid-health-login__provider${active ? " solid-health-login__provider--active" : ""}`}
                      aria-pressed={active}
                      onClick={() => {
                        setSelected(provider.url);
                        setCustomIssuer("");
                        setError(null);
                      }}
                    >
                      <span className="solid-health-login__radio" aria-hidden="true" />
                      <span className="solid-health-login__provider-copy">
                        <strong>{provider.label}</strong>
                        <span>{provider.url}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="solid-health-login__custom">
              <label htmlFor="solid-health-custom-issuer">Custom issuer</label>
              <div className="solid-health-login__input-wrap">
                <input
                  id="solid-health-custom-issuer"
                  type="url"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="https://your-pod-provider.example"
                  value={customIssuer}
                  disabled={submitting}
                  aria-invalid={customIsInvalid}
                  aria-describedby={customIsInvalid ? "solid-health-custom-issuer-error" : undefined}
                  onChange={(event) => {
                    setCustomIssuer(event.target.value);
                    setError(null);
                  }}
                />
                {customValue && (
                  <button
                    type="button"
                    className="solid-health-login__clear"
                    title="Back to provider list"
                    aria-label="Back to provider list"
                    disabled={submitting}
                    onClick={() => {
                      setCustomIssuer("");
                      setError(null);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              {customIsInvalid && (
                <p id="solid-health-custom-issuer-error" className="solid-health-login__validation" role="alert">
                  Enter a valid OIDC issuer or Pod URL.
                </p>
              )}
            </div>

            {error && !customIsInvalid && (
              <div className="solid-health-login__error" role="alert">
                <span aria-hidden="true">!</span>
                <p>{error}</p>
              </div>
            )}

            <footer className="solid-health-login__actions">
              {languageControl}
              <button
                className="solid-health-login__submit"
                type="submit"
                disabled={!issuerToLogin || submitting}
              >
                <FontAwesomeIcon icon="right-from-bracket" />
                <span>{submitting ? "Loading..." : "Login"}</span>
              </button>
            </footer>
          </form>
        </section>
      </div>
    </main>
  );
};

export default LoginScreen;
