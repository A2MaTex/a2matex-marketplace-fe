import { useMemo, useState } from "react";
import {
  FiCheck,
  FiMinus,
  FiPlus,
  FiSend,
  FiSlash,
} from "react-icons/fi";
import {
  buildReviewRequest,
  createReviewForm,
  REVIEW_LIMITS,
  reviewFeedbackBytes,
} from "../model/adminSubmissionReview";
import AdminSubmissionDialog from "./AdminSubmissionDialog";
import styles from "../page/AdminSubmissionReview.module.css";

const DECISIONS = [
  { value: "APPROVE", label: "Approve", icon: FiCheck, eligibility: "canApprove" },
  { value: "REQUEST_CHANGES", label: "Request changes", icon: FiMinus, eligibility: "canRequestChanges" },
  { value: "REJECT", label: "Reject", icon: FiSlash, eligibility: "canReject" },
];

export default function SubmissionReviewDialog({
  submission,
  initialDecision,
  eligibility,
  busy,
  error,
  onSubmit,
  onClose,
}) {
  const [decision, setDecision] = useState(initialDecision);
  const [form, setForm] = useState(createReviewForm);
  const [clientErrors, setClientErrors] = useState({});
  const fieldErrors = { ...clientErrors, ...(error?.fieldErrors ?? {}) };
  const bytes = useMemo(() => reviewFeedbackBytes(form), [form]);
  const feedbackRequired = decision !== "APPROVE";

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setClientErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const updateItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
    const errorKey = `items.${index}.${field}`;
    setClientErrors((current) => {
      if (!current[errorKey]) return current;
      const next = { ...current };
      delete next[errorKey];
      return next;
    });
  };

  const submit = (event) => {
    event.preventDefault();
    try {
      const request = buildReviewRequest(decision, form);
      setClientErrors({});
      onSubmit(request);
    } catch (validationError) {
      setClientErrors(validationError.fieldErrors ?? {});
    }
  };

  return (
    <AdminSubmissionDialog
      title={`Review submission #${submission.number}`}
      description="Choose an explicit decision. Scanner findings are evidence only and are never copied into Publisher feedback automatically."
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate>
        <div className={styles.dialogBody}>
          <div className={styles.decisionTabs} role="radiogroup" aria-label="Review decision">
            {DECISIONS.map(({ value, label, icon: Icon, eligibility: key }) => (
              <button
                type="button"
                role="radio"
                aria-checked={decision === value}
                className={decision === value ? styles.selectedDecision : ""}
                key={value}
                disabled={!eligibility[key] || busy}
                onClick={() => {
                  setDecision(value);
                  setClientErrors({});
                }}
              ><Icon />{label}</button>
            ))}
          </div>

          {decision === "APPROVE" ? (
            <div className={styles.approvalNotice}>
              <FiCheck />
              <div><strong>Approval queues a Product-release build.</strong><p>It does not select the release, activate the Product, or guarantee immediate Marketplace visibility.</p></div>
            </div>
          ) : (
            <div className={styles.feedbackEditor}>
              <label>
                <span>Publisher-safe summary <b>*</b><small>{form.summary.length}/{REVIEW_LIMITS.summary}</small></span>
                <textarea
                  value={form.summary}
                  onChange={(event) => setField("summary", event.target.value)}
                  rows="5"
                  maxLength={REVIEW_LIMITS.summary + 1}
                  placeholder="Explain the decision and the next action the Publisher should take…"
                  aria-invalid={Boolean(fieldErrors.summary)}
                  autoFocus
                />
                {fieldErrors.summary ? <em role="alert">{fieldErrors.summary}</em> : null}
              </label>

              <div className={styles.feedbackItemsHeader}>
                <div><strong>Actionable items</strong><p>Optional structured notes. Add a node ID only when it helps the Publisher locate the issue.</p></div>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({
                    ...current,
                    items: [...current.items, { message: "", nodeId: "" }],
                  }))}
                  disabled={busy || form.items.length >= REVIEW_LIMITS.items}
                ><FiPlus /> Add item</button>
              </div>
              {fieldErrors.items ? <em role="alert">{fieldErrors.items}</em> : null}
              <div className={styles.feedbackItems}>
                {form.items.map((item, index) => (
                  <fieldset key={index}>
                    <legend>Item {index + 1}</legend>
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({
                        ...current,
                        items: current.items.filter((_, itemIndex) => itemIndex !== index),
                      }))}
                      disabled={busy}
                      aria-label={`Remove feedback item ${index + 1}`}
                    ><FiMinus /></button>
                    <label>
                      <span>Message <b>*</b><small>{item.message.length}/{REVIEW_LIMITS.itemMessage}</small></span>
                      <textarea
                        value={item.message}
                        onChange={(event) => updateItem(index, "message", event.target.value)}
                        rows="3"
                        maxLength={REVIEW_LIMITS.itemMessage + 1}
                        aria-invalid={Boolean(fieldErrors[`items.${index}.message`])}
                      />
                      {fieldErrors[`items.${index}.message`] ? <em role="alert">{fieldErrors[`items.${index}.message`]}</em> : null}
                    </label>
                    <label>
                      <span>Node ID <small>{item.nodeId.length}/{REVIEW_LIMITS.nodeId}</small></span>
                      <input
                        value={item.nodeId}
                        onChange={(event) => updateItem(index, "nodeId", event.target.value)}
                        maxLength={REVIEW_LIMITS.nodeId + 1}
                        placeholder="Optional"
                        aria-invalid={Boolean(fieldErrors[`items.${index}.nodeId`])}
                      />
                      {fieldErrors[`items.${index}.nodeId`] ? <em role="alert">{fieldErrors[`items.${index}.nodeId`]}</em> : null}
                    </label>
                  </fieldset>
                ))}
              </div>
              <div className={`${styles.byteMeter} ${bytes > REVIEW_LIMITS.serializedBytes ? styles.byteMeterOver : ""}`}>
                <span style={{ width: `${Math.min(100, (bytes / REVIEW_LIMITS.serializedBytes) * 100)}%` }} />
                <small>{bytes.toLocaleString()} / {REVIEW_LIMITS.serializedBytes.toLocaleString()} UTF-8 bytes</small>
              </div>
              {fieldErrors.feedback ? <em role="alert">{fieldErrors.feedback}</em> : null}
            </div>
          )}

          {error ? <div className={styles.dialogError} role="alert">{error.message}</div> : null}
        </div>
        <footer className={styles.dialogFooter}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>Cancel</button>
          <button
            type="submit"
            className={`${styles.primaryButton} ${decision === "REJECT" ? styles.dangerButton : ""}`}
            disabled={busy || (feedbackRequired && bytes > REVIEW_LIMITS.serializedBytes)}
          >
            {busy ? <span className={styles.buttonSpinner} /> : <FiSend />}
            {busy ? "Saving decision…" : DECISIONS.find((item) => item.value === decision)?.label}
          </button>
        </footer>
      </form>
    </AdminSubmissionDialog>
  );
}
