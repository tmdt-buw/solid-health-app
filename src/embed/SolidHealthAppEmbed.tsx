import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "../App";

const DEFAULT_GOOGLE_CLIENT_ID =
  "445131822551-cpfah56jkslkhf771vfmjfkmibupvlsc.apps.googleusercontent.com";

type Props = {
  webId?: string | null;
  googleClientId?: string;
  language?: string | null;
};

export default function SolidHealthAppEmbed({
  webId,
  googleClientId = DEFAULT_GOOGLE_CLIENT_ID,
  language = null,
}: Props) {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <App embedded webIdOverride={webId || null} language={language} />
    </GoogleOAuthProvider>
  );
}
