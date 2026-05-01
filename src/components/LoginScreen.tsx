import React, { useState } from "react";
import "../auth.css";

type Props = {
  onSolidLogin: (issuer?: string) => void;
};

const PROVIDERS = [
  { label: "TMDT Solid", url: "https://tmdt-solid-community-server.de", note: "Recommended" },
  { label: "Solid Community", url: "https://solidcommunity.net", note: "Public community server" },
];

const HEART_PULSE_PATH =
  "M256 107.9L241 87.1C216 52.5 175.9 32 133.1 32 59.6 32 0 91.6 0 165.1l0 2.6c0 23.6 6.2 48 16.6 72.3l106 0c3.2 0 6.1-1.9 7.4-4.9l31.8-76.3c3.7-8.8 12.3-14.6 21.8-14.8s18.3 5.4 22.2 14.1l51.3 113.9 41.4-82.8c4.1-8.1 12.4-13.3 21.5-13.3s17.4 5.1 21.5 13.3l23.2 46.3c1.4 2.7 4.1 4.4 7.2 4.4l123.6 0c10.5-24.3 16.6-48.7 16.6-72.3l0-2.6C512 91.6 452.4 32 378.9 32 336.2 32 296 52.5 271 87.1l-15 20.7zM469.6 288l-97.8 0c-21.2 0-40.6-12-50.1-31l-1.7-3.4-42.5 85.1c-4.1 8.3-12.7 13.5-22 13.3s-17.6-5.7-21.4-14.1l-49.3-109.5-10.5 25.2c-8.7 20.9-29.1 34.5-51.7 34.5l-80.2 0c47.2 73.8 123 141.7 170.4 177.9 12.4 9.4 27.6 14.1 43.1 14.1s30.8-4.6 43.1-14.1C346.6 429.7 422.4 361.8 469.6 288z";

const LoginScreen: React.FC<Props> = ({ onSolidLogin }) => {
  const [selected, setSelected] = useState(PROVIDERS[0].url);
  const [customIssuer, setCustomIssuer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const useCustom = customIssuer.trim().length > 0;
  const issuerToLogin = useCustom ? customIssuer.trim() : selected;

  const submit = () => {
    try {
      const url = new URL(issuerToLogin);
      if (!/^https?:/.test(url.protocol)) throw new Error("invalid issuer");
      setError(null);
      onSolidLogin(issuerToLogin);
    } catch {
      setError("Enter a valid OIDC issuer or Pod URL.");
    }
  };

  return (
    <div className="auth-screen auth-screen--provider">
      <div className="login-wrap">
        <div className="login-hero">
          <div className="login-hero-left">
            <div>
              <div className="login-hero-title">
                <svg className="login-hero-svg" viewBox="0 0 512 512" aria-hidden="true">
                  <path d={HEART_PULSE_PATH} />
                </svg>
                Solid Health App
              </div>
              <div className="login-hero-sub">Choose your Solid Pod provider</div>
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-section">
            <div className="provider-guide">
              <div className="provider-guide-head">
                <span className="guide-title">No Solid Pod yet?</span>
                <span className="guide-sub">
                  Example using the <strong>TMDT Solid Server</strong>
                </span>
              </div>
              <div className="guide-steps">
                <div className="guide-step">
                  <span className="step-num">1</span>
                  <p>
                    Visit{" "}
                    <a href="https://tmdt-solid-community-server.de" target="_blank" rel="noreferrer">
                      tmdt-solid-community-server.de
                    </a>{" "}
                    or any other Solid Pod Provider.
                  </p>
                </div>
                <div className="guide-step">
                  <span className="step-num">2</span>
                  <p>
                    Click <strong>Register</strong> to create your account.
                  </p>
                </div>
                <div className="guide-step">
                  <span className="step-num">3</span>
                  <p>Log in and choose a name to create your Pod.</p>
                </div>
                <div className="guide-step">
                  <span className="step-num">4</span>
                  <p>Come back here, pick the provider and sign in with your new Pod.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="login-section">
            <div className="section-head">
              <span className="section-title">Suggested providers</span>
              <span className="section-hint">Pick a card or use "Custom issuer" below</span>
            </div>
            <div className="provider-grid">
              {PROVIDERS.map((provider) => {
                const isActive = selected === provider.url && !useCustom;
                return (
                  <button
                    key={provider.url}
                    type="button"
                    className={`prov-card${isActive ? " active" : ""}`}
                    onClick={() => {
                      setSelected(provider.url);
                      setCustomIssuer("");
                    }}
                    title={provider.url}
                  >
                    <span className={`radio${isActive ? " on" : ""}`} aria-hidden="true" />
                    <div className="prov-text">
                      <div className="prov-label">{provider.label}</div>
                      <div className="prov-url">{provider.url}</div>
                      <div className="prov-note">{provider.note}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="login-section">
            <div className="section-head">
              <span className="section-title">Custom issuer</span>
              <span className="section-hint">OIDC issuer URL of your Pod provider</span>
            </div>
            <div className="custom-row">
              <input
                className="custom-input"
                placeholder="https://your-pod-provider.example"
                value={customIssuer}
                onChange={(event) => setCustomIssuer(event.target.value)}
              />
              {useCustom && (
                <button
                  type="button"
                  className="clear-btn"
                  onClick={() => setCustomIssuer("")}
                  title="Back to provider list"
                >
                  x
                </button>
              )}
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="login-footer">
            <div className="login-meta">
              <span className="dot" /> Solid OIDC Login
            </div>
            <button
              className="login-primary"
              onClick={submit}
              disabled={!issuerToLogin}
              title="Log in with selected provider"
            >
              <span>Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
