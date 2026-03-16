// src/components/MePanel.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { TimePoint } from "../utils/loadFitDataFromPod";
import { computeKpis } from "../utils/computeKpis";
import "./MePanel.css";

type Props = {
  webId: string | null;
  googleToken: string | null;
  onSolidLogout: () => void;
  onGoogleLogout: () => void;

  steps?: TimePoint[];
  calories?: TimePoint[];
  sleep?: TimePoint[];
  weight?: TimePoint[];
  heartRates?: TimePoint[];
};

type Profile = {
  name: string;
  age?: number;
  heightCm?: number;
  weightManual?: number;
  avatarDataUrl?: string;
};

const LS_KEY = "me.profile.v1";

const nf0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const format = {
  int: (v?: number, unit = "") => (v == null ? "—" : `${nf0.format(v)}${unit}`),
  one: (v?: number, unit = "") => (v == null ? "—" : `${nf1.format(v)}${unit}`),
};

const MePanel: React.FC<Props> = ({
  webId,
  googleToken,
  onSolidLogout,
  onGoogleLogout,
  steps = [],
  calories = [],
  sleep = [],
  weight = [],
  heartRates = [],
}) => {
  // Profile-State mit localStorage-Persistenz
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : { name: "Dein Name", heightCm: 175 };
    } catch {
      return { name: "Dein Name", heightCm: 175 };
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(profile));
  }, [profile]);

  // Avatar Upload
  const fileRef = useRef<HTMLInputElement | null>(null);
  const onPickAvatar = () => fileRef.current?.click();

  const onAvatarChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfile((p) => ({ ...p, avatarDataUrl: String(reader.result) }));
    };
    reader.readAsDataURL(f);
  };

  // KPIs (7-Tage-Durchschnitt)
  const kpis = useMemo(
    () =>
      computeKpis(
        steps,
        calories,
        sleep,
        weight,
        heartRates,
        profile.heightCm ?? 175
      ),
    [steps, calories, sleep, weight, heartRates, profile.heightCm]
  );

  // Gewicht: Google → sonst manuell
  const displayWeightRaw = kpis.weightNow ?? profile.weightManual;
  const displayWeight = displayWeightRaw == null ? undefined : Number(displayWeightRaw);

  const updateNumber =
    (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setProfile((p) => ({
        ...p,
        [key]: e.target.value === "" ? undefined : Number(e.target.value),
      }));

  return (
    <div className="me-screen">
      <div className="me-decor" aria-hidden />

      {/* Header Card */}
      <div className="me-card header">
        <div
          className="me-avatar-wrap"
          onClick={onPickAvatar}
          title="Profilbild ändern"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onPickAvatar();
          }}
        >
          {profile.avatarDataUrl ? (
            <img className="me-avatar" src={profile.avatarDataUrl} alt="Avatar" />
          ) : (
            <div className="me-avatar placeholder">+</div>
          )}

          {!profile.avatarDataUrl && <div className="me-avatar-fab">Foto</div>}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onAvatarChange}
          />
        </div>

        <div className="me-name-row">
          <input
            className="me-name-input"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            placeholder="Dein Name"
          />
          <div className="me-subtle">Persönliches Profil</div>
        </div>

        <div className="me-quick-stats">
          <div className="me-qs">
            <div className="me-qs-num">{format.int(profile.age)}</div>
            <div className="me-qs-cap">Alter</div>
          </div>

          <div className="me-qs">
            <div className="me-qs-num">{format.one(kpis.bmiNow)}</div>
            <div className="me-qs-cap">BMI</div>
          </div>

          <div className="me-qs">
            <div className="me-qs-num">{format.int(profile.heightCm, " cm")}</div>
            <div className="me-qs-cap">Größe</div>
          </div>

          <div className="me-qs">
            <div className="me-qs-num">{format.one(displayWeight, " kg")}</div>
            <div className="me-qs-cap">Gewicht</div>
          </div>
        </div>
      </div>

      {/* Formular */}
      <div className="me-card form">
        <div className="me-field">
          <label>Alter</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="z. B. 30"
            value={profile.age ?? ""}
            onChange={updateNumber("age")}
          />
        </div>

        <div className="me-field">
          <label>Größe (cm)</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="z. B. 175"
            value={profile.heightCm ?? ""}
            onChange={updateNumber("heightCm")}
          />
        </div>

        {/* Gewicht: nur editierbar, wenn kein Google-Wert da */}
        <div className="me-field">
          <label>Gewicht (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder={kpis.weightNow != null ? "aus Google Fit" : "z. B. 72.5"}
            value={
              kpis.weightNow != null
                ? String(Math.round(kpis.weightNow * 10) / 10)
                : profile.weightManual ?? ""
            }
            onChange={kpis.weightNow != null ? undefined : updateNumber("weightManual")}
            readOnly={kpis.weightNow != null}
          />
        </div>

        {/* WebID über volle Breite */}
        <div className="me-field span-2">
          <label>Solid WebID</label>
          <input readOnly value={webId ?? "—"} />
        </div>
      </div>

      {/* KPIs Card */}
      <div className="me-card kpis">
        <div className="kpi">
          <div className="kpi-val">{format.int(kpis.stepsAvg7)}</div>
          <div className="kpi-cap">Ø Schritte (7T)</div>
        </div>

        <div className="kpi">
          <div className="kpi-val">{format.int(kpis.kcalAvg7, " kcal")}</div>
          <div className="kpi-cap">Ø Kalorien (7T)</div>
        </div>

        <div className="kpi">
          <div className="kpi-val">{format.one(kpis.sleepAvg7, " h")}</div>
          <div className="kpi-cap">Ø Schlaf (7T)</div>
        </div>

        <div className="kpi">
          <div className="kpi-val">{format.one(kpis.heartNow, " bpm")}</div>
          <div className="kpi-cap">Puls (letzter)</div>
        </div>
      </div>

      {/* Buttons (Theme) */}
      <div className="me-actions">
        <button className="tmdt-btn tmdt-btn--primary" onClick={onSolidLogout}>
          Solid Logout
        </button>
        <button className="tmdt-btn tmdt-btn--ghost" onClick={onGoogleLogout}>
          Google Logout
        </button>
      </div>

      <div style={{ height: "var(--nav-h)" }} />
    </div>
  );
};

export default MePanel;