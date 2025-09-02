import React from "react";
import "./bottom-nav.css";

type Tab = "health" | "me";

type Props = {
  active: Tab;
  onChange: (t: Tab) => void;
};

const HeartIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
      stroke={active ? "#ef4444" : "#9ca3af"}
      strokeWidth="1.8"
      fill={active ? "#ef4444" : "none"}
    />
  </svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke={active ? "#0ea5e9" : "#9ca3af"} strokeWidth="1.8" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke={active ? "#0ea5e9" : "#9ca3af"} strokeWidth="1.8" />
  </svg>
);

const BottomNav: React.FC<Props> = ({ active, onChange }) => {
  return (
    <nav className="bottom-nav">
      <button
        className={`bn-item ${active === "health" ? "active" : ""}`}
        onClick={() => onChange("health")}
      >
        <HeartIcon active={active === "health"} />
        <span>Health</span>
      </button>

      <button
        className={`bn-item ${active === "me" ? "active" : ""}`}
        onClick={() => onChange("me")}
      >
        <UserIcon active={active === "me"} />
        <span>Me</span>
      </button>
    </nav>
  );
};

export default BottomNav;
export type { Tab };
