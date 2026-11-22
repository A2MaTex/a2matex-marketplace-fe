import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { getSocialLoginErrorMessage } from "../api/socialLoginErrors";
import { useAuthStore } from "../store/authStore";
import {
  consumeSocialLoginState,
  consumeSocialLoginReturnTo,
  getSocialLoginRedirectUri,
} from "../api/socialLoginTransaction";
import styles from "../styles/SocialLoginCallbackPage.module.css";

const CALLBACK_MESSAGES = {
  processing: "Verifying your sign-in…",
  success: "Your provider sign-in was verified.",
  cancelled: "You cancelled sign-in.",
  invalidState: "This sign-in session is invalid or expired. Please start again.",
  missingCode: "The provider did not return a sign-in code. Please start again.",
  unavailable: "We could not complete sign-in. Go back and start a new attempt.",
  configuration: "Social sign-in is not configured for this address.",
};

const scheduleResult = (setStatus, setMessage, nextStatus, nextMessage) => {
  queueMicrotask(() => {
    setStatus(nextStatus);
    setMessage(nextMessage);
  });
};

const SocialLoginCallbackPage = ({ provider }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const startedRef = useRef(false);
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState(CALLBACK_MESSAGES.processing);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const callbackUrl = new URLSearchParams(location.search);
    const codes = callbackUrl.getAll("code");
    const states = callbackUrl.getAll("state");
    const code = codes.length === 1 ? codes[0] : null;
    const returnedState = states.length === 1 ? states[0] : null;
    const providerError = callbackUrl.getAll("error").length > 0;

    // Remove the one-time code and provider parameters from the address bar
    // before any API call or user-visible navigation.
    navigate(location.pathname, { replace: true });

    const expectedState = consumeSocialLoginState(provider);
    const returnTo = consumeSocialLoginReturnTo(provider);

    if (providerError) {
      scheduleResult(setStatus, setMessage, "error", CALLBACK_MESSAGES.cancelled);
      return;
    }

    if (!expectedState || !returnedState || returnedState !== expectedState) {
      scheduleResult(setStatus, setMessage, "error", CALLBACK_MESSAGES.invalidState);
      return;
    }

    if (!code) {
      scheduleResult(setStatus, setMessage, "error", CALLBACK_MESSAGES.missingCode);
      return;
    }

    let redirectUri;
    try {
      redirectUri = getSocialLoginRedirectUri(provider, window.location.origin);
    } catch {
      scheduleResult(setStatus, setMessage, "error", CALLBACK_MESSAGES.configuration);
      return;
    }

    authApi
      .socialLogin(provider, code, redirectUri)
      .then(({ accessToken, refreshToken }) => {
        const authStore = useAuthStore.getState();
        authStore.setCredentials(accessToken, refreshToken);
        authStore.setUser(null);
        navigate(returnTo, { replace: true });
      })
      .catch((error) => {
        setStatus("error");
        setMessage(getSocialLoginErrorMessage(error));
      });
  }, [location.pathname, location.search, navigate, provider]);

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-live="polite" aria-busy={status === "processing"}>
        <div
          className={`${styles.mark} ${status === "error" ? styles.errorMark : ""}`}
          aria-hidden="true"
        >
          {status === "processing" ? (
            <span className={styles.spinner} />
          ) : status === "error" ? (
            "!"
          ) : (
            "✓"
          )}
        </div>
        <h1 className={styles.title}>
          {provider === "google" ? "Google" : "GitHub"} sign-in
        </h1>
        <p className={status === "error" ? styles.error : styles.message} role={status === "error" ? "alert" : "status"}>
          {message}
        </p>
        {status !== "processing" && (
          <Link className={styles.loginLink} to="/login">
            Back to sign in
          </Link>
        )}
      </section>
    </main>
  );
};

export default SocialLoginCallbackPage;
