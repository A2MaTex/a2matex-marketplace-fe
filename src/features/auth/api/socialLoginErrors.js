const API_ERROR_MESSAGES = Object.freeze({
  "Error.InvalidAuthorizationCode":
    "This sign-in code expired or was already used. Start a new sign-in attempt.",
  "Error.RedirectUriNotAllowed":
    "The sign-in callback is not configured correctly. Please contact support.",
  "Error.ProviderNotConfigured":
    "This sign-in provider is not configured. Please try another option.",
  "Error.InvalidProviderEmail":
    "The provider returned an invalid email address. Please try another sign-in option.",
  "Error.ProviderEmailNotVerified":
    "Verify your email with the provider and try again, or sign in with your password.",
  "Error.ProviderEmailUnavailable":
    "We could not access your email. Grant the app email access and try again.",
  "Error.ProviderAlreadyLinked":
    "This account is already linked to this provider. Use the provider account you linked before.",
  "Error.AccountBlocked": "This account is blocked. Please contact support.",
  "Error.EmailOrUsernameNotFound":
    "This account has no active role. Use another account or contact support.",
  "Error.ProviderUnavailable":
    "The provider is temporarily unavailable. Start a new sign-in attempt in a few minutes.",
  "Error.UsernameGenerationExhausted":
    "We could not create your account right now. Start a new sign-in attempt in a few minutes.",
});

const GENERIC_API_ERROR =
  "We could not complete sign-in. Go back and start a new attempt.";

export const ACCOUNT_USES_SOCIAL_LOGIN = "Error.AccountUsesSocialLogin";

const PROVIDER_LABELS = Object.freeze({
  GOOGLE: "Google",
  GITHUB: "GitHub",
});

// The backend sends `message` as a bare string on some doors and as an array of
// { message, path } items on others, so both shapes have to be unwrapped.
const getApiErrorCodes = (error) => {
  const responseMessage = error?.response?.data?.message;
  if (typeof responseMessage === "string") return [responseMessage];
  if (Array.isArray(responseMessage)) {
    return responseMessage
      .map((item) => item?.message)
      .filter((message) => typeof message === "string");
  }
  return [];
};

export const getSocialLoginErrorMessage = (error) =>
  API_ERROR_MESSAGES[getApiErrorCodes(error)[0]] ?? GENERIC_API_ERROR;

/**
 * Error.AccountUsesSocialLogin guards every password door the backend has, not only
 * login: register, both OTP types, password reset and change-password. It carries a
 * `path` of `account`, a field most of those forms do not render, so each page has to
 * recognise it instead of feeding it to the usual field-error path. The wording stays
 * with the page; only the match lives here.
 */
export const isAccountUsesSocialLoginError = (error) =>
  getApiErrorCodes(error).includes(ACCOUNT_USES_SOCIAL_LOGIN);

/**
 * Only the authenticated change-password door names the providers — the public doors
 * stay silent on purpose, so this returns an empty list there. The backend joins the
 * names into one string because its exception filter passes through scalar details only.
 */
export const getSocialLoginProviderLabels = (error) => {
  const providers = error?.response?.data?.details?.providers;
  if (typeof providers !== "string") return [];

  return providers
    .split(",")
    .map((provider) => provider.trim())
    .filter(Boolean)
    .map((provider) => PROVIDER_LABELS[provider] ?? provider);
};
