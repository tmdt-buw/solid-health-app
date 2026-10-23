import React from "react";
import Footer from "../standalone/StandaloneFooter";
import { appVersion } from "../version";
import { useI18n } from "../i18n";
export default function StandaloneFooter() {
  const { language } = useI18n();
  return <Footer title="Health App" version={appVersion} language={language} assetsBase={process.env.PUBLIC_URL || ""} />;
}
