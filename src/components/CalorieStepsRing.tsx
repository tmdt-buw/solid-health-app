import React from "react";
import "./calories-steps-ring.css";

type Props = {
  steps: number;
  calories: number;
  stepGoal?: number;
  calorieGoal?: number;
};

const ShoeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 15c3 0 5.5-1 7-3l3 2 4 1c1 .3 2 1.2 2 2.5V19H3v-4z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M10 9l2 3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const FlameIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 3c1 3-2 4-2 6 0 1.5 1 2.5 2 3 1-1 2-2 2-4 0-2-1-3-2-5z" fill="currentColor" />
    <path d="M12 22c-4 0-7-3-7-7 0-3 2-5 4-6-1 5 3 6 3 6s4-1 3-6c2 1 4 3 4 6 0 4-3 7-7 7z"
      stroke="currentColor" strokeWidth="1.4" fill="none"/>
  </svg>
);

const percent = (v: number, goal: number) => Math.min(100, Math.max(0, (v / goal) * 100));

const CalorieStepsRing: React.FC<Props> = ({
  steps,
  calories,
  stepGoal = 10000,
  calorieGoal = 2500,
}) => {
  const stepPct = percent(steps, stepGoal);
  const calPct  = percent(calories, calorieGoal);

  return (
    <div className="ring-card">
      <div className="ring-row">
        {/* Schritte */}
        <div className="ring">
          <svg viewBox="0 0 36 36" className="ring-svg">
            <path className="bg" d="M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831 a 15.9155 15.9155 0 1 1 0 -31.831" />
            <path className="meter steps" strokeDasharray={`${stepPct}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831 a 15.9155 15.9155 0 1 1 0 -31.831" />
          </svg>

          <div className="ring-center">
            <span className="ring-icon shoe"><ShoeIcon/></span>
            <div className="ring-number">{Math.floor(steps).toLocaleString()}</div>
            <div className="ring-caption">Schritte</div>
          </div>
        </div>

        {/* Kalorien */}
        <div className="ring">
          <svg viewBox="0 0 36 36" className="ring-svg">
            <path className="bg" d="M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831 a 15.9155 15.9155 0 1 1 0 -31.831" />
            <path className="meter calories" strokeDasharray={`${calPct}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831 a 15.9155 15.9155 0 1 1 0 -31.831" />
          </svg>

          <div className="ring-center">
            <span className="ring-icon flame"><FlameIcon/></span>
            <div className="ring-number">{Math.floor(calories).toLocaleString()}</div>
            <div className="ring-caption">Kalorien</div>
          </div>
        </div>
      </div>

      <div className="ring-summary">
        <span>👟 Ziel: {stepGoal.toLocaleString()} Schritte</span>
        <span>🔥 Ziel: {calorieGoal.toLocaleString()} kcal</span>
      </div>
    </div>
  );
};

export default CalorieStepsRing;
