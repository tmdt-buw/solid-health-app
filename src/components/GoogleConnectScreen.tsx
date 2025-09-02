// src/components/GoogleConnectScreen.tsx
import React, { useState } from "react";
import "../auth.css";
import { MetricKey, DEFAULT_SELECTION } from "../auth/fitScopes";

type Props = {
  initial?: Partial<Record<MetricKey, boolean>>;
  onCancel: () => void;                          // back / logout / later
  onConfirm: (sel: Partial<Record<MetricKey, boolean>>) => void; // start Google login
};

const ALL_KEYS: MetricKey[] = ["steps", "calories", "sleep", "heartRate", "weight"];

export default function GoogleConnectScreen({ initial, onCancel, onConfirm }: Props) {
  const [sel, setSel] = useState<Partial<Record<MetricKey, boolean>>>(initial ?? DEFAULT_SELECTION);

  const toggle = (k: MetricKey) => setSel((old) => ({ ...old, [k]: !old[k] }));

  return (
    <div className="auth-screen">
      <div className="auth-decor" aria-hidden />

      <div className="auth-inner">
        <img src="/icon512_rounded.png" alt="Health Logo" className="auth-logo-large" />

        <h2 className="auth-heading">Google Fit verbinden</h2>
        <p className="auth-subtle">
          Wähle, welche Daten synchronisiert und im Pod gespeichert werden dürfen.
        </p>

        <div className="auth-checklist">
          {ALL_KEYS.map((k) => (
            <label key={k} className="auth-check">
              <input type="checkbox" checked={!!sel[k]} onChange={() => toggle(k)} />
              <span style={{ marginLeft: 10 }}>
                {k === "steps" && "Schritte"}
                {k === "calories" && "Kalorien"}
                {k === "sleep" && "Schlaf"}
                {k === "heartRate" && "Puls"}
                {k === "weight" && "Gewicht"}
              </span>
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
<button type="button" className="btn-ghost" onClick={onCancel}>
  Abbrechen
</button>
        </div>
      </div>

      <button className="auth-fab" onClick={() => onConfirm(sel)}>
        Verbinden <span className="arrow">→</span>
      </button>
    </div>
  );
}
