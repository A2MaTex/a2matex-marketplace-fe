import {
  getSocialLoginRedirectUri,
  SOCIAL_LOGIN_RETURN_TO_STORAGE_KEYS,
  SOCIAL_LOGIN_STATE_STORAGE_KEYS,
} from "./socialLoginTransaction.js";

const PROVIDERS = Object.freeze({
  google: {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId:
      import.meta.env?.VITE_GOOGLE_CLIENT_ID,
    scope: "openid email profile",
  },
  github: {
    authorizationEndpoint: "https://github.com/login/oauth/authorize",
    clientId: import.meta.env?.VITE_GITHUB_CLIENT_ID,
    scope: "read:user user:email",
  },
});

const createState = (cryptoApi) => {
  if (!cryptoApi?.getRandomValues) {
    throw new Error("Secure random generation is unavailable.");
  }

  const bytes = cryptoApi.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const createSocialAuthorizationUrl = (
  provider,
  {
    origin = window.location.origin,
    storage = window.sessionStorage,
    cryptoApi = window.crypto,
    returnTo = "/",
  } = {},
) => {
  const config = PROVIDERS[provider];
  const storageKey = SOCIAL_LOGIN_STATE_STORAGE_KEYS[provider];

  if (!config || !storageKey) {
    throw new Error("Unsupported social login provider.");
  }
  if (!config.clientId) {
    throw new Error("Social login provider is missing its client ID.");
  }

  const redirectUri = getSocialLoginRedirectUri(provider, origin);
  const state = createState(cryptoApi);
  storage.setItem(storageKey, state);
  storage.setItem(SOCIAL_LOGIN_RETURN_TO_STORAGE_KEYS[provider], returnTo);

  const authorizationUrl = new URL(config.authorizationEndpoint);
  authorizationUrl.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scope,
    state,
  }).toString();

  return authorizationUrl.toString();
};
