import { useRef, useState } from "react";
import { createSocialAuthorizationUrl } from "../api/socialLoginOAuth";

const START_ERROR =
  "Social sign-in is unavailable on this address. Please sign in with your username and password.";

export const useSocialLogin = (returnTo = "/") => {
  const [pendingProvider, setPendingProvider] = useState(null);
  const [error, setError] = useState("");
  const pendingRef = useRef(false);

  const startLogin = (provider) => {
    if (pendingRef.current) return;

    pendingRef.current = true;
    setPendingProvider(provider);
    setError("");

    try {
      const authorizationUrl = createSocialAuthorizationUrl(provider, { returnTo });
      window.location.assign(authorizationUrl);
    } catch {
      pendingRef.current = false;
      setPendingProvider(null);
      setError(START_ERROR);
    }
  };

  return { startLogin, pendingProvider, error };
};
