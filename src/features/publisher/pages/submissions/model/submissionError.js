import { SubmissionContractError } from "./submissionContract.js";
import { SubmissionValidationError } from "./submissionForm.js";

const MESSAGES = {
  "Error.SubmissionAlreadyOpen": "This product already has a submission in progress.",
  "Error.SubmissionProductIncomplete": "Complete the product metadata and media before submitting.",
  "Error.WorkflowRevisionDraftVersionConflict": "The project draft changed. Review the latest version before submitting again.",
  "Error.WorkflowRevisionRuntimeIrRequired": "Compile and save the project draft before creating a submission.",
  "Error.SubmissionIdempotencyKeyReused": "This request key was already used with different submission data.",
  "Error.SubmissionScanPublishFailed": "The submission was saved, but its scan message could not be published.",
  "Error.SubmissionCreateTimeout": "The create request timed out and may already have been saved.",
  "Error.ProductSuspended": "This product is suspended and cannot be submitted.",
  "Error.ProductArchived": "This product is archived and cannot be submitted.",
  "Error.ProductNotFound": "This product is unavailable or outside your access scope.",
  "Error.ProjectNotFound": "The source project is unavailable.",
};

const validationIssues = (message) => {
  if (!Array.isArray(message)) return {};
  return message.reduce((errors, issue) => {
    if (typeof issue?.path === "string" && typeof issue?.message === "string") {
      errors[issue.path] = issue.message;
    }
    return errors;
  }, {});
};

export const isCanceledSubmissionRequest = (error) =>
  error?.code === "ERR_CANCELED" || error?.name === "CanceledError";

export const toPublisherSubmissionError = (error, fallbackMessage) => {
  if (error instanceof SubmissionValidationError) {
    return {
      code: "VALIDATION_ERROR",
      message: error.message,
      fieldErrors: error.fieldErrors,
      uncertain: false,
      retryableSameIntent: false,
    };
  }
  if (error instanceof SubmissionContractError) {
    return {
      code: "INVALID_RESPONSE",
      message: "The submission service returned data in an unsupported format.",
      fieldErrors: {},
      uncertain: false,
      retryableSameIntent: false,
    };
  }

  const rawMessage = error?.response?.data?.message;
  const fieldErrors = validationIssues(rawMessage);
  const code = typeof rawMessage === "string" ? rawMessage : null;
  const status = error?.response?.status ?? null;
  const timedOut = error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT";
  const networkFailure = status === null && !isCanceledSubmissionRequest(error);
  const uncertainCodes = new Set([
    "Error.SubmissionScanPublishFailed",
    "Error.SubmissionCreateTimeout",
  ]);
  const uncertain = timedOut || networkFailure || uncertainCodes.has(code);

  return {
    code: code ?? (status ? `HTTP_${status}` : timedOut ? "TIMEOUT" : "NETWORK_ERROR"),
    message:
      (Object.keys(fieldErrors).length > 0
        ? "Review the highlighted submission fields."
        : MESSAGES[code]) ??
      (status === 401
        ? "Your session has expired. Please sign in again."
        : fallbackMessage),
    fieldErrors,
    uncertain,
    retryableSameIntent: uncertain,
  };
};
