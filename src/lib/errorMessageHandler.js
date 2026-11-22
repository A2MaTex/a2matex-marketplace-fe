// DEF-006
export const ERROR_MESSAGES = {
  "Error.EmailAlreadyExists": "This email is already registered.", // MSG05
  "Error.UsernameAlreadyExists": "This username is already taken.", // MSG06
  "Error.InvalidOTP": "The verification code is incorrect.", // MSG07
  "Error.OTPExpired":
    "The verification code has expired. Please request a new one.", // MSG08
  "Error.FailedToSendOTP":
    "Could not send the verification code. Please try again later.", // MSG09
  "Error.InvalidCredentials": "Incorrect account or password. Please check again.", // MSG10
  "Error.InvalidPassword": "Incorrect account or password. Please check again.", // MSG10
  "Error.EmailOrUsernameNotFound":
    "Incorrect account or password. Please check again.", // MSG10
  "Error.EmailNotFound": "No account is registered with this email.", // MSG11
  "Error.SessionExpired": "Your session has expired. Please sign in again.", // MSG12
  "Error.RefreshTokenAlreadyUsed":
    "Your session has expired. Please sign in again.", // MSG12
  "Error.AccountBlocked": "You do not have permission to perform this action.", // MSG34
  "Error.AccountUsesSocialLogin":
    "This account signs in with Google or GitHub. Use that option to sign in.", // MSG59
  // DEF-014
  "Error.PublisherTermNotActive": "Publisher registration is temporarily unavailable.", // MSG16
  "Error.PublisherAlreadyActivated": "Your publisher account is already active.", // MSG17
  "Error.PublisherBlocked": "Your publisher account is blocked.", // MSG18
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

export const translateError = (message) => {
  if (message === undefined || message === null) return GENERIC_ERROR;
  const text = message.toString();
  if (ERROR_MESSAGES[text]) return ERROR_MESSAGES[text];
  // DEF-006
  return text.startsWith("Error.") ? GENERIC_ERROR : text;
};

export const getErrorMessage = ({ message }) => {
  if (!message) return null;
  if (!Array.isArray(message)) {
    return {
      isFormError: false,
      data: translateError(message),
    };
  }

  return {
    isFormError: true,
    data: Object.fromEntries(
      message.map((item) => [item.path, translateError(item.message)]),
    ),
  };
};
