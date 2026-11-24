export const adminSubmissionsUrl = "/submissions";

export const adminSubmissionDetailUrl = (submissionId) =>
  `/submissions/${submissionId}`;

export const adminSubmissionScanRetryUrl = (submissionId) =>
  `/submissions/${submissionId}/scan-retry`;

export const adminSubmissionReviewUrl = (submissionId) =>
  `/submissions/${submissionId}/review`;
