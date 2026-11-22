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

const getApiErrorCode = (error) => {
  const responseMessage = error?.response?.data?.message;
  if (typeof responseMessage === "string") return responseMessage;
  if (Array.isArray(responseMessage)) {
    return responseMessage.find((item) => typeof item?.message === "string")?.message;
  }
  return null;
};

export const getSocialLoginErrorMessage = (error) =>
  API_ERROR_MESSAGES[getApiErrorCode(error)] ?? GENERIC_API_ERROR;
