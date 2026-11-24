import { AdminSubmissionContractError } from "./adminSubmissionContract.js";
import { AdminSubmissionReviewValidationError } from "./adminSubmissionReview.js";

const MESSAGES = {
  "Error.SubmissionNotFound": "This submission no longer exists or is outside your access scope.",
  "Error.SubmissionAccessDenied": "Your account is not allowed to access this submission.",
  "Error.SubmissionScanNotRetryable": "The scan state changed and can no longer be retried.",
  "Error.SubmissionNotReadyForReview": "The submission is no longer ready for review.",
  "Error.SubmissionAlreadyReviewed": "Another administrator has already completed a different review decision.",
  "Error.SubmissionReviewConflict": "This decision conflicts with the review already stored by the server.",
  "Error.SubmissionScanFailed": "A failed scan cannot be approved. Request changes or reject instead.",
  "Error.SubmissionScanIncomplete": "The scan evidence is incomplete. Refresh before reviewing.",
  "Error.SubmissionNotEligibleForApproval": "The Product or Publisher is no longer eligible for approval.",
  "Error.SubmissionSelfReviewForbidden": "You cannot review a submission that you created.",
  "Error.SubmissionReviewTimeout": "The review timed out. Its outcome may be uncertain, so the submission is being refreshed.",
  "Error.SubmissionReviewStateInvalid": "The stored review state is inconsistent. Escalate this submission for investigation.",
  "Error.ProductReleaseBuildPublishFailed": "The decision may be saved, but the release-build message could not be published. The submission is being refreshed.",
};

const pathString = (path) =>
  Array.isArray(path) ? path.join(".") : typeof path === "string" ? path : null;

const validationIssues = (message) => {
  if (!Array.isArray(message)) return {};
  return message.reduce((result, issue) => {
    const path = pathString(issue?.path);
    if (path && typeof issue?.message === "string") {
      result[path.replace(/^feedback\./, "")] = issue.message;
    }
    return result;
  }, {});
};

export const isCanceledAdminSubmissionRequest = (error) =>
  error?.code === "ERR_CANCELED" || error?.name === "CanceledError";

export const toAdminSubmissionError = (
  error,
  fallbackMessage = "The submission operation could not be completed.",
) => {
  if (error instanceof AdminSubmissionReviewValidationError) {
    return {
      code: "VALIDATION_ERROR",
      status: null,
      message: error.message,
      fieldErrors: error.fieldErrors,
      kind: "validation",
      conflict: false,
      uncertain: false,
    };
  }
  if (error instanceof AdminSubmissionContractError) {
    return {
      code: "INVALID_RESPONSE",
      status: null,
      message: "The submission service returned an unsupported Admin projection.",
      detail: error.message,
      fieldErrors: {},
      kind: "contract",
      conflict: false,
      uncertain: false,
    };
  }

  const status = error?.response?.status ?? null;
  const rawMessage = error?.response?.data?.message;
  const code = typeof rawMessage === "string" ? rawMessage : null;
  const fieldErrors = validationIssues(rawMessage);
  const timedOut = ["ECONNABORTED", "ETIMEDOUT"].includes(error?.code);
  const networkFailure = status === null && !isCanceledAdminSubmissionRequest(error);
  const uncertain =
    timedOut ||
    networkFailure ||
    ["Error.ProductReleaseBuildPublishFailed", "Error.SubmissionReviewTimeout"].includes(code);
  const statusMessage = {
    403: "Your account is not allowed to review submissions.",
    404: "This submission no longer exists or is outside your access scope.",
    503: "Submission review is temporarily unavailable.",
  }[status];

  return {
    code: code ?? (status ? `HTTP_${status}` : timedOut ? "TIMEOUT" : "NETWORK_ERROR"),
    status,
    message:
      (Object.keys(fieldErrors).length
        ? "Review the highlighted feedback fields."
        : MESSAGES[code]) ?? statusMessage ?? fallbackMessage,
    fieldErrors,
    kind: status === 403 ? "forbidden" : status === 404 ? "not-found" : "request",
    conflict: status === 409,
    uncertain,
  };
};
