import React, { useState } from "react";
import "../auth.css";
import { MetricKey, DEFAULT_SELECTION } from "../auth/fitScopes";

type Props = {
  initial?: Partial<Record<MetricKey, boolean>>;
  onCancel: () => void;
  onConfirm: (sel: Partial<Record<MetricKey, boolean>>) => void;
};

const ALL_KEYS: MetricKey[] = ["steps", "calories", "sleep", "heartRate", "weight"];
const LABELS: Record<MetricKey, string> = {
  steps: "Steps",
  calories: "Calories",
  sleep: "Sleep",
  heartRate: "Heart rate",
  weight: "Weight",
};
const HEART_PULSE_PATH =
  "M256 107.9L241 87.1C216 52.5 175.9 32 133.1 32 59.6 32 0 91.6 0 165.1l0 2.6c0 23.6 6.2 48 16.6 72.3l106 0c3.2 0 6.1-1.9 7.4-4.9l31.8-76.3c3.7-8.8 12.3-14.6 21.8-14.8s18.3 5.4 22.2 14.1l51.3 113.9 41.4-82.8c4.1-8.1 12.4-13.3 21.5-13.3s17.4 5.1 21.5 13.3l23.2 46.3c1.4 2.7 4.1 4.4 7.2 4.4l123.6 0c10.5-24.3 16.6-48.7 16.6-72.3l0-2.6C512 91.6 452.4 32 378.9 32 336.2 32 296 52.5 271 87.1l-15 20.7zM469.6 288l-97.8 0c-21.2 0-40.6-12-50.1-31l-1.7-3.4-42.5 85.1c-4.1 8.3-12.7 13.5-22 13.3s-17.6-5.7-21.4-14.1l-49.3-109.5-10.5 25.2c-8.7 20.9-29.1 34.5-51.7 34.5l-80.2 0c47.2 73.8 123 141.7 170.4 177.9 12.4 9.4 27.6 14.1 43.1 14.1s30.8-4.6 43.1-14.1C346.6 429.7 422.4 361.8 469.6 288z";

export default function GoogleConnectScreen({ initial, onCancel, onConfirm }: Props) {
  const [sel, setSel] = useState<Partial<Record<MetricKey, boolean>>>(initial ?? DEFAULT_SELECTION);
  const [storageAcknowledged, setStorageAcknowledged] = useState(false);

  const toggle = (key: MetricKey) =>
    setSel((old) => ({ ...old, [key]: !old[key] }));

  const hasSelection = ALL_KEYS.some((key) => Boolean(sel[key]));
  const canConnect = storageAcknowledged && hasSelection;

  return (
    <div className="auth-screen">
      <div className="auth-inner auth-inner--google-connect">
        <div className="auth-icon" aria-hidden="true">
          <svg viewBox="0 0 512 512" focusable="false">
            <path d={HEART_PULSE_PATH} />
          </svg>
        </div>

        <h2 className="auth-heading">Connect Google Fit</h2>
        <p className="auth-subtle">
          Choose which health metrics may be synchronized and stored in your Solid Pod.
        </p>

        <div className="auth-checklist">
          {ALL_KEYS.map((key) => (
            <label key={key} className="auth-check">
              <input type="checkbox" checked={!!sel[key]} onChange={() => toggle(key)} />
              <span>{LABELS[key]}</span>
            </label>
          ))}
        </div>

        <div className="auth-storage">
          <div className="auth-storage__label">Pod storage</div>
          <div className="auth-storage__value">health/</div>
          <div className="auth-storage__hint">
            Solid Health App will create this folder if it does not exist and store the selected Google Fit data there.
          </div>
          <label className="auth-consent">
            <input
              type="checkbox"
              checked={storageAcknowledged}
              onChange={(event) => setStorageAcknowledged(event.target.checked)}
            />
            <span>
              I agree that Solid Health App may create the health/ folder in my Solid Pod and store the selected metrics there.
            </span>
          </label>
        </div>

        <div className="auth-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="auth-primary"
            disabled={!canConnect}
            onClick={() => onConfirm(sel)}
          >
            Connect <span className="arrow">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
