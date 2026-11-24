export const REVIEW_DECISIONS = [
  "APPROVE",
  "REQUEST_CHANGES",
  "REJECT",
];

export const REVIEW_LIMITS = {
  summary: 2_000,
  items: 50,
  itemMessage: 1_000,
  nodeId: 128,
  serializedBytes: 65_536,
};

export class AdminSubmissionReviewValidationError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.name = "AdminSubmissionReviewValidationError";
    this.fieldErrors = fieldErrors;
  }
}

const hasStorableText = (value) => {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if ((code <= 0x1f || code === 0x7f) && ![0x09, 0x0a, 0x0d].includes(code)) {
      return false;
    }
    if (code >= 0xd800 && code <= 0xdbff) {
      const low = value.charCodeAt(index + 1);
      if (!(low >= 0xdc00 && low <= 0xdfff)) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return false;
    }
  }
  return true;
};

const validateText = (value, field, label, maximum, errors, required = true) => {
  const raw = String(value ?? "");
  const trimmed = raw.trim();
  if (required && !trimmed) errors[field] = `${label} is required.`;
  else if (raw.length > maximum) errors[field] = `${label} must be ${maximum.toLocaleString()} characters or fewer.`;
  else if (raw && !hasStorableText(raw)) errors[field] = `${label} contains unsupported control characters.`;
  return trimmed;
};

export const createReviewForm = () => ({ summary: "", items: [] });

export const reviewEligibility = (submission) => {
  const pendingScan = submission?.status === "PENDING_SCAN";
  const ready = submission?.status === "READY_FOR_REVIEW";
  const completedScan = ["PASSED", "FAILED"].includes(submission?.scanStatus);
  return {
    canRetryScan:
      pendingScan && ["QUEUED", "ERROR"].includes(submission?.scanStatus),
    canReview: ready && completedScan,
    canApprove:
      ready && submission?.scanStatus === "PASSED" && submission?.scanResult !== null,
    canRequestChanges: ready && completedScan,
    canReject: ready && completedScan,
  };
};

export const buildReviewRequest = (decision, form = createReviewForm()) => {
  if (!REVIEW_DECISIONS.includes(decision)) {
    throw new AdminSubmissionReviewValidationError("Choose a review decision.", {
      decision: "Choose a review decision.",
    });
  }
  if (decision === "APPROVE") return { decision };

  const errors = {};
  const summary = validateText(
    form.summary,
    "summary",
    "Summary",
    REVIEW_LIMITS.summary,
    errors,
  );
  const sourceItems = Array.isArray(form.items) ? form.items : [];
  if (sourceItems.length > REVIEW_LIMITS.items) {
    errors.items = `Add at most ${REVIEW_LIMITS.items} feedback items.`;
  }

  const items = sourceItems.map((item, index) => {
    const message = validateText(
      item?.message,
      `items.${index}.message`,
      `Feedback item ${index + 1}`,
      REVIEW_LIMITS.itemMessage,
      errors,
    );
    const nodeId = validateText(
      item?.nodeId,
      `items.${index}.nodeId`,
      `Node ID ${index + 1}`,
      REVIEW_LIMITS.nodeId,
      errors,
      false,
    );
    return { message, ...(nodeId ? { nodeId } : {}) };
  });

  const feedback = { summary, ...(items.length ? { items } : {}) };
  const bytes = new TextEncoder().encode(JSON.stringify(feedback)).byteLength;
  if (bytes > REVIEW_LIMITS.serializedBytes) {
    errors.feedback = `Feedback is ${bytes.toLocaleString()} bytes; the limit is ${REVIEW_LIMITS.serializedBytes.toLocaleString()} bytes.`;
  }
  if (Object.keys(errors).length) {
    throw new AdminSubmissionReviewValidationError(
      "Review the highlighted feedback fields.",
      errors,
    );
  }
  return { decision, feedback };
};

export const reviewFeedbackBytes = (form) => {
  const feedback = {
    summary: String(form?.summary ?? "").trim(),
    ...(form?.items?.length
      ? {
          items: form.items.map((item) => ({
            message: String(item.message ?? "").trim(),
            ...(String(item.nodeId ?? "").trim()
              ? { nodeId: String(item.nodeId).trim() }
              : {}),
          })),
        }
      : {}),
  };
  return new TextEncoder().encode(JSON.stringify(feedback)).byteLength;
};
