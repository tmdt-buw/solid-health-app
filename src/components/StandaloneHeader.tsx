import React, { useEffect, useState } from "react";
import { LanguageSelect } from "../i18n";
import { loadSolidProfileSummary, SolidProfileSummary } from "../utils/loadSolidProfileSummary";
import FontAwesomeIcon from "./FontAwesomeIcon";

type Props = {
  webId: string;
  solidFetch: typeof fetch;
  onLogout: () => void | Promise<void>;
};

export default function StandaloneHeader({ webId, solidFetch, onLogout }: Props) {
  const [profile, setProfile] = useState<SolidProfileSummary>({ name: "Solid User" });
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProfile({ name: "Solid User" });
    void loadSolidProfileSummary(webId, solidFetch).then((nextProfile) => {
      if (!cancelled) setProfile(nextProfile);
    });
    return () => {
      cancelled = true;
    };
  }, [solidFetch, webId]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setPhotoSrc(null);
    if (!profile.photoUrl) return () => undefined;

    void solidFetch(profile.photoUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Profile photo unavailable");
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPhotoSrc(objectUrl);
      })
      .catch(() => {
        // Keep the authenticated identity visible if a private photo cannot be loaded.
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile.photoUrl, solidFetch]);

  return (
    <header className="solid-health-header">
      <div className="solid-health-header__brand">
        <FontAwesomeIcon icon="heart-pulse" />
        <strong>Health App</strong>
      </div>

      <div className="solid-health-header__actions">
        <div className="solid-health-header__user" title={webId}>
          {photoSrc ? (
            <img className="solid-health-header__avatar" src={photoSrc} alt="" />
          ) : (
            <span className="solid-health-header__avatar solid-health-header__avatar--fallback" aria-hidden="true">
              <FontAwesomeIcon icon="circle-user" />
            </span>
          )}
          <span className="solid-health-header__identity">
            <strong translate="no">{profile.name}</strong>{" "}
            <span>({webId})</span>
          </span>
        </div>
        <LanguageSelect className="language-select--header" />
        <button className="solid-health-header__logout" type="button" onClick={() => void onLogout()}>
          <FontAwesomeIcon icon="right-from-bracket" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
