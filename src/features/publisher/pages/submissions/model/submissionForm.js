const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const SUBMISSION_FORM_LIMITS = {
  version: 100,
  changelog: 5_000,
  purpose: 2_000,
  testInstructions: 5_000,
  knownLimitation: 500,
  knownLimitations: 20,
};

export class SubmissionValidationError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.name = "SubmissionValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export const createSubmissionForm = () => ({
  version: "",
  changelog: "",
  minimumLauncherVersion: "1.0.0",
  minimumRuntimeVersion: "1.0.0",
  purpose: "",
  testInstructions: "",
  knownLimitations: "",
});

const text = (value) => String(value ?? "").trim();

export const parseKnownLimitations = (value) =>
  String(value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const validateSemver = (value, field, label, errors) => {
  if (!value) errors[field] = `${label} is required.`;
  else if (value.length > SUBMISSION_FORM_LIMITS.version || !SEMVER_PATTERN.test(value)) {
    errors[field] = `${label} must use the x.y.z format without a prerelease suffix.`;
  }
};

export const getSubmissionFormErrors = ({ form, productId, sourceDraftVersion }) => {
  const errors = {};
  const normalized = {
    version: text(form.version),
    changelog: text(form.changelog),
    minimumLauncherVersion: text(form.minimumLauncherVersion),
    minimumRuntimeVersion: text(form.minimumRuntimeVersion),
    purpose: text(form.purpose),
    testInstructions: text(form.testInstructions),
    knownLimitations: parseKnownLimitations(form.knownLimitations),
  };

  if (!UUID_PATTERN.test(String(productId ?? ""))) {
    errors.productId = "Select an eligible product.";
  }
  if (!Number.isInteger(sourceDraftVersion) || sourceDraftVersion < 1) {
    errors.sourceDraftVersion = "A compiled project draft is required.";
  }

  validateSemver(normalized.version, "releaseRequest.version", "Release version", errors);
  validateSemver(
    normalized.minimumLauncherVersion,
    "releaseRequest.minimumLauncherVersion",
    "Minimum launcher version",
    errors,
  );
  validateSemver(
    normalized.minimumRuntimeVersion,
    "releaseRequest.minimumRuntimeVersion",
    "Minimum runtime version",
    errors,
  );

  if (!normalized.changelog) {
    errors["releaseRequest.changelog"] = "Changelog is required.";
  } else if (normalized.changelog.length > SUBMISSION_FORM_LIMITS.changelog) {
    errors["releaseRequest.changelog"] = `Changelog must be ${SUBMISSION_FORM_LIMITS.changelog} characters or fewer.`;
  }
  if (!normalized.purpose) {
    errors["reviewContext.purpose"] = "Purpose is required.";
  } else if (normalized.purpose.length > SUBMISSION_FORM_LIMITS.purpose) {
    errors["reviewContext.purpose"] = `Purpose must be ${SUBMISSION_FORM_LIMITS.purpose} characters or fewer.`;
  }
  if (!normalized.testInstructions) {
    errors["reviewContext.testInstructions"] = "Test instructions are required.";
  } else if (
    normalized.testInstructions.length > SUBMISSION_FORM_LIMITS.testInstructions
  ) {
    errors["reviewContext.testInstructions"] = `Test instructions must be ${SUBMISSION_FORM_LIMITS.testInstructions} characters or fewer.`;
  }

  if (normalized.knownLimitations.length > SUBMISSION_FORM_LIMITS.knownLimitations) {
    errors["reviewContext.knownLimitations"] = `Add at most ${SUBMISSION_FORM_LIMITS.knownLimitations} known limitations.`;
  } else if (
    normalized.knownLimitations.some(
      (item) => item.length > SUBMISSION_FORM_LIMITS.knownLimitation,
    )
  ) {
    errors["reviewContext.knownLimitations"] = `Each limitation must be ${SUBMISSION_FORM_LIMITS.knownLimitation} characters or fewer.`;
  } else if (new Set(normalized.knownLimitations).size !== normalized.knownLimitations.length) {
    errors["reviewContext.knownLimitations"] = "Known limitations must not be duplicated.";
  }

  return errors;
};

export const buildSubmissionCreateInput = ({
  form,
  productId,
  sourceDraftVersion,
}) => {
  const errors = getSubmissionFormErrors({ form, productId, sourceDraftVersion });
  if (Object.keys(errors).length > 0) {
    throw new SubmissionValidationError(
      "Complete the required submission fields.",
      errors,
    );
  }

  return {
    productId,
    sourceDraftVersion,
    releaseRequest: {
      version: text(form.version),
      changelog: text(form.changelog),
      minimumLauncherVersion: text(form.minimumLauncherVersion),
      minimumRuntimeVersion: text(form.minimumRuntimeVersion),
    },
    reviewContext: {
      purpose: text(form.purpose),
      testInstructions: text(form.testInstructions),
      knownLimitations: parseKnownLimitations(form.knownLimitations),
    },
  };
};

export const submissionInputToForm = (input) => ({
  version: input.releaseRequest.version,
  changelog: input.releaseRequest.changelog,
  minimumLauncherVersion: input.releaseRequest.minimumLauncherVersion,
  minimumRuntimeVersion: input.releaseRequest.minimumRuntimeVersion,
  purpose: input.reviewContext.purpose,
  testInstructions: input.reviewContext.testInstructions,
  knownLimitations: input.reviewContext.knownLimitations.join("\n"),
});
