import React from "react";
import { appVersion } from "../version";

export default function StandaloneFooter() {
  return (
    <footer className="solid-health-footer">
      <div className="solid-health-footer__logos" aria-label="Project partners">
        <img
          src="/semantic-data-catalog/assets/images/Logo_BUW.png"
          alt="Logo BUW"
          className="solid-health-footer__logo solid-health-footer__logo--buw"
        />
        <img
          src="/semantic-data-catalog/assets/images/Logo_TMDT.png"
          alt="Logo TMDT"
          className="solid-health-footer__logo solid-health-footer__logo--tmdt"
        />
      </div>
      <div className="solid-health-footer__version">Health App {appVersion}</div>
    </footer>
  );
}
