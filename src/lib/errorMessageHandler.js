// DEF-006
import {
  ERROR_CODE_MESSAGES,
  getErrorCodeMessage,
} from "../constants/errorCodeMessages.js";

export { ERROR_CODE_MESSAGES as ERROR_MESSAGES };

const GENERIC_ERROR = "Something went wrong. Please try again.";

export const translateError = (message) => {
  if (message === undefined || message === null) return GENERIC_ERROR;
  const text = message.toString();
  if (ERROR_CODE_MESSAGES[text]) return ERROR_CODE_MESSAGES[text];
  return text.startsWith("Error.") ? getErrorCodeMessage(text, GENERIC_ERROR) : text;
};

const messageIssues = (message) => {
  if (!Array.isArray(message)) {
    if (message && typeof message === "object" && "message" in message) {
      return [{
        message: message.message,
        path: Array.isArray(message.path) ? message.path.join(".") : message.path ?? null,
      }];
    }
    return message === undefined || message === null
      ? []
      : [{ message, path: null }];
  }
  return message
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      message: item.message,
      path: Array.isArray(item.path) ? item.path.join(".") : item.path ?? null,
    }))
    .filter((item) => item.message !== undefined && item.message !== null);
};

export const getApiErrorMessage = (error, fallback = GENERIC_ERROR) => {
  const rawMessage = error?.response?.data?.message ?? error?.message;
  const messages = [...new Set(
    messageIssues(rawMessage).map((item) => translateError(item.message)),
  )];
  return messages.length ? messages.join(" ") : fallback;
};

export const getApiErrorCode = (error) => {
  const rawMessage = error?.response?.data?.message ?? error;
  return messageIssues(rawMessage)
    .map((item) => item.message)
    .find((message) => typeof message === "string" && message.startsWith("Error.")) ?? null;
};

export const getErrorMessage = ({ message }) => {
  if (!message) return null;
  if (!Array.isArray(message) && !(typeof message === "object" && "message" in message)) {
    return {
      isFormError: false,
      data: translateError(message),
    };
  }

  return {
    isFormError: true,
    data: Object.fromEntries(
      messageIssues(message).map((item, index) => [
        item.path ?? `_form.${index}`,
        translateError(item.message),
      ]),
    ),
  };
};

/**
 * Splits backend field errors into the ones a form actually renders and the ones it
 * does not. The backend keys them by its own `path`, and a path with no matching input
 * — `account` on Error.AccountUsesSocialLogin, `code` on an expired OTP at a step that
 * no longer shows the OTP box — would be written to state nothing reads, leaving the
 * user with no error at all. Callers show `unmatched` in their server-error banner.
 */
export const splitFieldErrors = (data, formFields) => {
  const fields = new Set(formFields);
  const fieldErrors = {};
  const unmatched = [];

  Object.entries(data).forEach(([path, message]) => {
    if (fields.has(path)) fieldErrors[path] = message;
    else unmatched.push(message);
  });

  return { fieldErrors, unmatched };
};
