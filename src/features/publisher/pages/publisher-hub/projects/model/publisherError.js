import { PublisherContractError } from "./projectContract";

const ERROR_MESSAGES = {
  "Error.ProjectAccessDenied": "You do not have access to this project.",
  "Error.PublisherNotActivated": "Activate your publisher account to access projects.",
  "Error.PublisherBlocked": "Your publisher account is currently blocked.",
  "Error.ProjectNotFound": "This project is unavailable or outside your access scope.",
};

export const isCanceledRequest = (error) =>
  error?.code === "ERR_CANCELED" || error?.name === "CanceledError";

export const toPublisherError = (error, fallbackMessage) => {
  if (error instanceof PublisherContractError) {
    return {
      code: "INVALID_RESPONSE",
      message: "The project service returned data in an unsupported format.",
      retryable: true,
    };
  }

  const code = error?.response?.data?.message ?? null;
  const status = error?.response?.status ?? null;
  return {
    code: code ?? (status ? `HTTP_${status}` : "NETWORK_ERROR"),
    message:
      ERROR_MESSAGES[code] ??
      (status === 401
        ? "Your session has expired. Please sign in again."
        : fallbackMessage),
    retryable: status === null || status >= 500 || status === 429,
  };
};
