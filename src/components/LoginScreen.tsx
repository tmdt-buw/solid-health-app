import React, { useState } from "react";
import "../auth.css";

type Props = {
  onSolidLogin: (issuer?: string) => void;
};

const SUGGESTED_ISSUERS = [
  "https://solidcommunity.net",
  "https://inrupt.net",
  "https://pod.inrupt.com",
];

const LoginScreen: React.FC<Props> = ({ onSolidLogin }) => {
  const [issuer, setIssuer] = useState("https://solidcommunity.net");
  const [error, setError] = useState<string | null>(null);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      const u = new URL(issuer);
      if (!/^https?:/.test(u.protocol)) throw new Error("invalid");
      setError(null);
      onSolidLogin(issuer);
    } catch {
      setError("Bitte eine gültige OIDC/Pod-URL eingeben");
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-decor" aria-hidden />

      <div className="auth-inner">
        <img src="/icon512_rounded.png" alt="Health Logo" className="auth-logo-large" />

        <h2 className="auth-heading">Login</h2>
        <p className="auth-subtle">Melde dich mit deinem Solid Pod an</p>

        <form onSubmit={submit}>
          <label htmlFor="issuer" className="auth-label">Pod / OIDC-Issuer</label>
          <input
            id="issuer"
            type="url"
            className="auth-input"
            placeholder="https://solidcommunity.net"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            list="issuers"
            required
            autoCapitalize="none"
            autoCorrect="off"
          />
          <datalist id="issuers">
            {SUGGESTED_ISSUERS.map((it) => (
              <option key={it} value={it} />
            ))}
          </datalist>

          {error && <div className="auth-error">{error}</div>}
        </form>
      </div>

      <button className="auth-fab" onClick={() => submit()}>
        Einloggen <span className="arrow">→</span>
      </button>
    </div>
  );
};

export default LoginScreen;
