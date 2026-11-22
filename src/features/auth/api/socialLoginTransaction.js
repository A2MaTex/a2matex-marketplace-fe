import { isSafeInternalReturnTo } from "./safeReturnTo.js";

export const SOCIAL_LOGIN_STATE_STORAGE_KEYS = Object.freeze({
  google: "a2matex.oauth.google.state",
  github: "a2matex.oauth.github.state",
});

export const SOCIAL_LOGIN_RETURN_TO_STORAGE_KEYS = Object.freeze({
  google: "a2matex.oauth.google.return-to",
  github: "a2matex.oauth.github.return-to",
});

export const getSocialLoginRedirectUri = (provider, origin) => {
  if (!Object.hasOwn(SOCIAL_LOGIN_STATE_STORAGE_KEYS, provider)) {
    throw new Error("Unsupported social login provider.");
  }

  const callbackPath = `/auth/${provider}/callback`;
  const allowedOrigins = {
    "http://localhost:3000": `http://localhost:3000${callbackPath}`,
    "https://a2matex.com": `https://a2matex.com${callbackPath}`,
  };
  const redirectUri = allowedOrigins[origin];

  if (!redirectUri) {
    throw new Error("Social login is not configured for this site origin.");
  }

  return redirectUri;
};

export const consumeSocialLoginState = (provider, storage) => {
  const storageKey = SOCIAL_LOGIN_STATE_STORAGE_KEYS[provider];
  if (!storageKey) return null;

  try {
    const transactionStorage = storage ?? window.sessionStorage;
    const state = transactionStorage.getItem(storageKey);
    transactionStorage.removeItem(storageKey);
    return state;
  } catch {
    return null;
  }
};

export const consumeSocialLoginReturnTo = (provider, storage) => {
  const storageKey = SOCIAL_LOGIN_RETURN_TO_STORAGE_KEYS[provider];
  if (!storageKey) return "/";

  try {
    const transactionStorage = storage ?? window.sessionStorage;
    const returnTo = transactionStorage.getItem(storageKey) || "/";
    transactionStorage.removeItem(storageKey);
    return isSafeInternalReturnTo(returnTo) ? returnTo : "/";
  } catch {
    return "/";
  }
};
