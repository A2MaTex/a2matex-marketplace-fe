export const PUBLISHER_POLL_DELAYS = [4_000, 8_000, 15_000, 30_000];

export const pollDelayForAttempt = (attempt) =>
  PUBLISHER_POLL_DELAYS[
    Math.min(Math.max(0, attempt), PUBLISHER_POLL_DELAYS.length - 1)
  ];

export const shouldPollSubmission = ({ poll, submissionId, status }) =>
  Boolean(poll && submissionId && status === "PENDING_SCAN");

export const shouldPollProductReleases = ({ poll, productId, releases }) =>
  Boolean(
    poll &&
      productId &&
      releases.some((release) => release.status === "BUILDING"),
  );

export const expectedReleaseState = ({ expectedSubmissionId, releases }) => {
  if (!expectedSubmissionId) return "NOT_EXPECTED";
  return releases.some((release) => release.submissionId === expectedSubmissionId)
    ? "AVAILABLE"
    : "WAITING";
};
