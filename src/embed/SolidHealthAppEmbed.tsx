import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "../App";

const DEFAULT_GOOGLE_CLIENT_ID =
  "445131822551-cpfah56jkslkhf771vfmjfkmibupvlsc.apps.googleusercontent.com";

type Props = {
  webId?: string | null;
  googleClientId?: string;
};

export default function SolidHealthAppEmbed({
  webId,
  googleClientId = DEFAULT_GOOGLE_CLIENT_ID,
}: Props) {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <App embedded webIdOverride={webId || null} />
    </GoogleOAuthProvider>
  );
}
