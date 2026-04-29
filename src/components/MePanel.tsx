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

const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const format = {
  int: (v?: number, unit = "") => (v == null ? "-" : `${nf0.format(v)}${unit}`),
  one: (v?: number, unit = "") => (v == null ? "-" : `${nf1.format(v)}${unit}`),
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
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : { name: "Your name", heightCm: 175 };
    } catch {
      return { name: "Your name", heightCm: 175 };
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(profile));
  }, [profile]);

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
          title="Change profile picture"
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

          {!profile.avatarDataUrl && <div className="me-avatar-fab">Photo</div>}

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
            placeholder="Your name"
          />
          <div className="me-subtle">Personal profile</div>
        </div>

        <div className="me-quick-stats">
          <div className="me-qs">
            <div className="me-qs-num">{format.int(profile.age)}</div>
            <div className="me-qs-cap">Age</div>
          </div>

          <div className="me-qs">
            <div className="me-qs-num">{format.one(kpis.bmiNow)}</div>
            <div className="me-qs-cap">BMI</div>
          </div>

          <div className="me-qs">
            <div className="me-qs-num">{format.int(profile.heightCm, " cm")}</div>
            <div className="me-qs-cap">Height</div>
          </div>

          <div className="me-qs">
            <div className="me-qs-num">{format.one(displayWeight, " kg")}</div>
            <div className="me-qs-cap">Weight</div>
          </div>
        </div>
      </div>

      <div className="me-card form">
        <div className="me-field">
          <label>Age</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 30"
            value={profile.age ?? ""}
            onChange={updateNumber("age")}
          />
        </div>

        <div className="me-field">
          <label>Height (cm)</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 175"
            value={profile.heightCm ?? ""}
            onChange={updateNumber("heightCm")}
          />
        </div>

        <div className="me-field">
          <label>Weight (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder={kpis.weightNow != null ? "from Google Fit" : "e.g. 72.5"}
            value={
              kpis.weightNow != null
                ? String(Math.round(kpis.weightNow * 10) / 10)
                : profile.weightManual ?? ""
            }
            onChange={kpis.weightNow != null ? undefined : updateNumber("weightManual")}
            readOnly={kpis.weightNow != null}
          />
        </div>

        <div className="me-field span-2">
          <label>Solid WebID</label>
          <input readOnly value={webId ?? "-"} />
        </div>
      </div>

      <div className="me-card kpis">
        <div className="kpi">
          <div className="kpi-val">{format.int(kpis.stepsAvg7)}</div>
          <div className="kpi-cap">Avg steps (7d)</div>
        </div>

        <div className="kpi">
          <div className="kpi-val">{format.int(kpis.kcalAvg7, " kcal")}</div>
          <div className="kpi-cap">Avg calories (7d)</div>
        </div>

        <div className="kpi">
          <div className="kpi-val">{format.one(kpis.sleepAvg7, " h")}</div>
          <div className="kpi-cap">Avg sleep (7d)</div>
        </div>

        <div className="kpi">
          <div className="kpi-val">{format.one(kpis.heartNow, " bpm")}</div>
          <div className="kpi-cap">Latest heart rate</div>
        </div>
      </div>

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

