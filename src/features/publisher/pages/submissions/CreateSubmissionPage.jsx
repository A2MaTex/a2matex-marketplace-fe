import { useState } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiFileText,
  FiRefreshCw,
  FiSend,
  FiX,
} from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { publisherSubmissionApi } from "../api/submission/api";
import { useProjectDraft } from "../projects/hooks/useProjectDraft";
import { usePublisherProduct } from "../products/hooks/usePublisherProduct";
import { useOpenSubmission } from "./hooks/useOpenSubmission";
import { useSubmissionCreateIntent } from "./hooks/useSubmissionCreateIntent";
import { useSubmissionProducts } from "./hooks/useSubmissionProducts";
import {
  invalidatePublisherSubmission,
} from "./hooks/usePublisherSubmission";
import { invalidatePublisherSubmissions } from "./hooks/usePublisherSubmissions";
import { parseCreatedSubmissionId } from "./model/submissionContract";
import { toPublisherSubmissionError } from "./model/submissionError";
import {
  buildSubmissionCreateInput,
  createSubmissionForm,
  parseKnownLimitations,
  submissionInputToForm,
  SUBMISSION_FORM_LIMITS,
} from "./model/submissionForm";
import styles from "./CreateSubmissionPage.module.css";

const RELEASABLE_STATUSES = ["DRAFT", "ACTIVE"];
const FIELD_ORDER = [
  "productId",
  "sourceDraftVersion",
  "releaseRequest.version",
  "releaseRequest.changelog",
  "releaseRequest.minimumLauncherVersion",
  "releaseRequest.minimumRuntimeVersion",
  "reviewContext.purpose",
  "reviewContext.testInstructions",
  "reviewContext.knownLimitations",
];

const CreateSubmissionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedProductId = searchParams.get("productId") || null;
  const productsState = useSubmissionProducts(RELEASABLE_STATUSES);
  const productState = usePublisherProduct(selectedProductId);
  const product = productState.data;
  const projectId = product?.project?.id ?? null;
  const draftState = useProjectDraft(projectId);
  const openState = useOpenSubmission(selectedProductId);
  const intentState = useSubmissionCreateIntent(selectedProductId);
  const restoredForm = intentState.intent
    ? submissionInputToForm(intentState.intent.body)
    : createSubmissionForm();
  const [formState, setFormState] = useState(() => ({
    productId: selectedProductId,
    form: restoredForm,
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const form =
    formState.productId === selectedProductId
      ? formState.form
      : intentState.intent
        ? submissionInputToForm(intentState.intent.body)
        : createSubmissionForm();
  const locked = Boolean(intentState.intent);
  const currentDraftVersion = draftState.data?.draft?.version ?? null;
  const sourceDraftVersion = locked
    ? intentState.intent.body.sourceDraftVersion
    : currentDraftVersion;

  const setField = (field, value) => {
    setFormState({
      productId: selectedProductId,
      form: { ...form, [field]: value },
    });
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (submitError?.code === "VALIDATION_ERROR") setSubmitError(null);
  };

  const selectProduct = (productId) => {
    if (locked || submitting) return;
    setFormState({ productId, form: createSubmissionForm() });
    setFieldErrors({});
    setSubmitError(null);
    navigate(`/publisher/submissions/new${productId ? `?productId=${productId}` : ""}`);
  };

  const metadataComplete = Boolean(
    product?.name?.trim() &&
      product?.slug?.trim() &&
      product?.shortDescription?.trim() &&
      product?.description?.trim(),
  );
  const checks = [
    {
      label: "Product is DRAFT or ACTIVE",
      ready: Boolean(product && RELEASABLE_STATUSES.includes(product.status)),
      loading: productState.loading,
    },
    {
      label: "Required product metadata is complete",
      ready: metadataComplete,
      loading: productState.loading,
    },
    {
      label: "Source project is ACTIVE",
      ready: product?.project?.status === "ACTIVE",
      loading: productState.loading,
    },
    {
      label: "Project draft exists",
      ready: Boolean(draftState.data?.draft),
      loading: draftState.loading,
    },
    {
      label: "Runtime IR is compiled and saved",
      ready: Boolean(draftState.data?.draft?.runtimeIr),
      loading: draftState.loading,
    },
    {
      label: "No submission is currently open",
      ready: !openState.data,
      loading: openState.loading,
    },
  ];
  const preflightError = productState.error || draftState.error || openState.error;
  const eligible =
    Boolean(selectedProductId) &&
    !preflightError &&
    checks.every((check) => !check.loading && check.ready);

  const focusFirstError = (errors) => {
    const field = FIELD_ORDER.find((name) => errors[name]);
    if (!field) return;
    requestAnimationFrame(() => {
      document.querySelector(`[data-submission-field="${field}"]`)?.focus();
    });
  };

  const executeIntent = async (intent) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await publisherSubmissionApi.createSubmission(intent.body, {
        idempotencyKey: intent.idempotencyKey,
      });
      const submissionId = parseCreatedSubmissionId(response.data);
      intentState.clear();
      invalidatePublisherSubmissions();
      invalidatePublisherSubmission(submissionId);
      navigate(`/publisher/submissions/${submissionId}`);
    } catch (error) {
      const mapped = toPublisherSubmissionError(
        error,
        "Unable to create this submission.",
      );
      setSubmitError(mapped);
      setFieldErrors(mapped.fieldErrors);
      focusFirstError(mapped.fieldErrors);
      if (!mapped.uncertain) intentState.clear();
      if (mapped.code === "Error.WorkflowRevisionDraftVersionConflict") {
        draftState.refetch();
      }
      if (mapped.code === "Error.SubmissionAlreadyOpen") {
        openState.refetch();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || locked) return;
    if (!eligible) {
      setSubmitError({
        code: "PREFLIGHT_FAILED",
        message: "Resolve the eligibility checks before creating a submission.",
        fieldErrors: {},
        uncertain: false,
      });
      return;
    }
    try {
      const body = buildSubmissionCreateInput({
        form,
        productId: selectedProductId,
        sourceDraftVersion,
      });
      const intent = intentState.prepare(body);
      await executeIntent(intent);
    } catch (error) {
      const mapped = toPublisherSubmissionError(
        error,
        "Review the submission form.",
      );
      setSubmitError(mapped);
      setFieldErrors(mapped.fieldErrors);
      focusFirstError(mapped.fieldErrors);
    }
  };

  const handleStartNewIntent = () => {
    const confirmed = window.confirm(
      "The previous request may already have been saved. Start a new request with a new idempotency key anyway?",
    );
    if (!confirmed) return;
    intentState.clear();
    setSubmitError(null);
    setFieldErrors({});
  };

  const renderFieldError = (field) =>
    fieldErrors[field] ? (
      <small className={styles.fieldError} role="alert">{fieldErrors[field]}</small>
    ) : null;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <button type="button" onClick={() => navigate("/publisher/submissions")} aria-label="Back to submissions">
          <FiArrowLeft />
        </button>
        <div>
          <p>Trust & safety</p>
          <h1>Create submission</h1>
          <span>Freeze the current Product and compiled Draft for automated scan and administrator review.</span>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {locked ? (
          <section className={styles.intentNotice} role="status">
            <FiAlertTriangle />
            <div>
              <strong>A create request is awaiting a certain outcome.</strong>
              <p>The form is locked so retry uses the same body and idempotency key. Starting a new request may create a duplicate intent if the previous request committed.</p>
              <code>{intentState.intent.idempotencyKey}</code>
            </div>
          </section>
        ) : null}

        <section className={styles.section}>
          <header><span>1</span><div><h2>Product and source Draft</h2><p>Choose a releasable Product and verify the latest compiled Draft.</p></div></header>
          <label className={styles.field}>
            <span>Product <b>*</b></span>
            <select
              data-submission-field="productId"
              value={selectedProductId ?? ""}
              onChange={(event) => selectProduct(event.target.value)}
              disabled={productsState.loading || submitting || locked}
              aria-invalid={Boolean(fieldErrors.productId)}
            >
              <option value="">Select a product</option>
              {productsState.data.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || item.slug || "Untitled product"} · {item.status}
                </option>
              ))}
            </select>
            {renderFieldError("productId")}
            {productsState.error ? <small className={styles.fieldError}>{productsState.error.message}</small> : null}
          </label>

          {selectedProductId ? (
            <div className={styles.sourceGrid}>
              <div>
                <span>Product</span>
                <strong>{product?.name || (productState.loading ? "Loading..." : "Unavailable")}</strong>
                <small>{product?.slug || selectedProductId}</small>
              </div>
              <div>
                <span>Project</span>
                <strong>{product?.project?.name || "Unavailable"}</strong>
                <small>{product?.project?.status || "Unknown status"}</small>
              </div>
              <div>
                <span>Source Draft</span>
                <strong>{sourceDraftVersion ? `Version ${sourceDraftVersion}` : "Unavailable"}</strong>
                <small>{draftState.data?.draft?.contentHash?.slice(0, 16) || "No content hash"}</small>
              </div>
            </div>
          ) : null}

          {selectedProductId ? (
            <div className={styles.preflight}>
              <div className={styles.preflightHeader}>
                <strong>Eligibility preflight</strong>
                <button type="button" onClick={() => {
                  productState.refetch();
                  draftState.refetch();
                  openState.refetch();
                }} disabled={submitting}>
                  <FiRefreshCw /> Refresh
                </button>
              </div>
              <ul>
                {checks.map((check) => (
                  <li key={check.label} className={check.loading ? styles.checkLoading : check.ready ? styles.checkReady : styles.checkFailed}>
                    {check.loading ? <FiClock /> : check.ready ? <FiCheck /> : <FiX />}
                    <span>{check.label}</span>
                  </li>
                ))}
              </ul>
              {preflightError ? <p className={styles.fieldError}>{preflightError.message}</p> : null}
              {openState.data ? (
                <p className={styles.openSubmission}>
                  Submission #{openState.data.number} is still {openState.data.status.replaceAll("_", " ").toLowerCase()}.
                  <Link to={`/publisher/submissions/${openState.data.id}`}>Open it</Link>
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className={styles.section}>
          <header><span>2</span><div><h2>Release request</h2><p>Define the semantic version and runtime compatibility for the build.</p></div></header>
          <div className={styles.threeColumns}>
            <label className={styles.field}>
              <span>Release version <b>*</b></span>
              <input data-submission-field="releaseRequest.version" value={form.version} onChange={(event) => setField("version", event.target.value)} disabled={locked || submitting} placeholder="1.0.0" aria-invalid={Boolean(fieldErrors["releaseRequest.version"])} />
              {renderFieldError("releaseRequest.version")}
            </label>
            <label className={styles.field}>
              <span>Minimum launcher <b>*</b></span>
              <input data-submission-field="releaseRequest.minimumLauncherVersion" value={form.minimumLauncherVersion} onChange={(event) => setField("minimumLauncherVersion", event.target.value)} disabled={locked || submitting} placeholder="1.0.0" aria-invalid={Boolean(fieldErrors["releaseRequest.minimumLauncherVersion"])} />
              {renderFieldError("releaseRequest.minimumLauncherVersion")}
            </label>
            <label className={styles.field}>
              <span>Minimum runtime <b>*</b></span>
              <input data-submission-field="releaseRequest.minimumRuntimeVersion" value={form.minimumRuntimeVersion} onChange={(event) => setField("minimumRuntimeVersion", event.target.value)} disabled={locked || submitting} placeholder="1.0.0" aria-invalid={Boolean(fieldErrors["releaseRequest.minimumRuntimeVersion"])} />
              {renderFieldError("releaseRequest.minimumRuntimeVersion")}
            </label>
          </div>
          <label className={styles.field}>
            <span>Changelog <b>*</b><small>{form.changelog.length}/{SUBMISSION_FORM_LIMITS.changelog}</small></span>
            <textarea data-submission-field="releaseRequest.changelog" value={form.changelog} onChange={(event) => setField("changelog", event.target.value)} disabled={locked || submitting} rows={6} maxLength={SUBMISSION_FORM_LIMITS.changelog} placeholder="Summarize the features, fixes and compatibility changes in this release." aria-invalid={Boolean(fieldErrors["releaseRequest.changelog"])} />
            {renderFieldError("releaseRequest.changelog")}
          </label>
        </section>

        <section className={styles.section}>
          <header><span>3</span><div><h2>Administrator review context</h2><p>Give reviewers enough information to reproduce the intended behavior.</p></div></header>
          <label className={styles.field}>
            <span>Purpose <b>*</b><small>{form.purpose.length}/{SUBMISSION_FORM_LIMITS.purpose}</small></span>
            <textarea data-submission-field="reviewContext.purpose" value={form.purpose} onChange={(event) => setField("purpose", event.target.value)} disabled={locked || submitting} rows={4} maxLength={SUBMISSION_FORM_LIMITS.purpose} placeholder="Explain the product's intended outcome and target users." aria-invalid={Boolean(fieldErrors["reviewContext.purpose"])} />
            {renderFieldError("reviewContext.purpose")}
          </label>
          <label className={styles.field}>
            <span>Test instructions <b>*</b><small>{form.testInstructions.length}/{SUBMISSION_FORM_LIMITS.testInstructions}</small></span>
            <textarea data-submission-field="reviewContext.testInstructions" value={form.testInstructions} onChange={(event) => setField("testInstructions", event.target.value)} disabled={locked || submitting} rows={7} maxLength={SUBMISSION_FORM_LIMITS.testInstructions} placeholder="List setup, test data, steps and expected results." aria-invalid={Boolean(fieldErrors["reviewContext.testInstructions"])} />
            {renderFieldError("reviewContext.testInstructions")}
          </label>
          <label className={styles.field}>
            <span>Known limitations <em>Optional · one per line</em><small>{parseKnownLimitations(form.knownLimitations).length}/{SUBMISSION_FORM_LIMITS.knownLimitations}</small></span>
            <textarea data-submission-field="reviewContext.knownLimitations" value={form.knownLimitations} onChange={(event) => setField("knownLimitations", event.target.value)} disabled={locked || submitting} rows={5} placeholder="Only supports Android 13+" aria-invalid={Boolean(fieldErrors["reviewContext.knownLimitations"])} />
            {renderFieldError("reviewContext.knownLimitations")}
          </label>
        </section>

        <footer className={styles.footer}>
          <div>
            {submitError ? (
              <p className={submitError.uncertain ? styles.uncertainError : styles.submitError} role="alert">
                {submitError.message}
              </p>
            ) : (
              <p><FiFileText /> Creating a submission freezes Product and Draft snapshots.</p>
            )}
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={() => navigate("/publisher/submissions")} disabled={submitting}>Cancel</button>
            {locked ? (
              <>
                <button type="button" className={styles.secondaryButton} onClick={handleStartNewIntent} disabled={submitting}>Start new request</button>
                <button type="button" className={styles.primaryButton} onClick={() => executeIntent(intentState.intent)} disabled={submitting}>
                  <FiRefreshCw /> {submitting ? "Retrying..." : "Retry same request"}
                </button>
              </>
            ) : (
              <button type="submit" className={styles.primaryButton} disabled={submitting || !eligible}>
                <FiSend /> {submitting ? "Creating..." : "Create submission"}
              </button>
            )}
          </div>
        </footer>
      </form>
    </div>
  );
};

export default CreateSubmissionPage;
