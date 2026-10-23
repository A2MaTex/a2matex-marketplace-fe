import { useState } from "react";
import { MdClose, MdSave, MdLock } from "react-icons/md";
import { BsTagFill } from "react-icons/bs";
import { SummernoteEditor } from "@eaeao/summernote-react";
import "@eaeao/summernote-react/styles.css";
import "@eaeao/summernote-react/icons.css";
import { termApi } from "@/features/term/termApi";
import { useAuthStore } from "@/features/auth/store/authStore";
import TERM_TYPE from "@/constants/term";
import styles from "./CreateTermModal.module.css";

const TYPE_OPTIONS = [
  {
    value: TERM_TYPE.PUBLISHER_TERMS,
    label: "PUBLISHER_TERMS (Marketplace & Tool Providers)",
  },
  {
    value: TERM_TYPE.CUSTOMER_TERMS,
    label: "CUSTOMER_TERMS (End Users & Buyers)",
  },
  { value: TERM_TYPE.PRIVACY_POLICY, label: "PRIVACY_POLICY (Data & Privacy)" },
];

// Minimal toolbar matching the design
const TOOLBAR = [
  ["style", ["bold", "italic", "underline", "strikethrough"]],
  ["para", ["ul", "ol"]],
  ["misc", ["codeview", "link", "table"]],
  ["history", ["undo", "redo"]],
];

export default function CreateTermModal({ onClose, onCreated }) {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({
    type: TERM_TYPE.PUBLISHER_TERMS,
    version: "",
    title: "",
    content: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.type) errs.type = "Required";
    if (!form.version.trim()) errs.version = "Required";
    if (!form.title.trim()) errs.title = "Required";
    if (
      !form.content ||
      form.content === "<p><br></p>" ||
      form.content.trim() === ""
    )
      errs.content = "Required";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const res = await termApi.createNewTerm({
        type: form.type,
        version: form.version.trim(),
        title: form.title.trim(),
        content: form.content,
      });
      const created = res?.data?.data ?? res?.data ?? {};
      onCreated({
        id: created.id ?? `draft-${Date.now()}`,
        type: form.type,
        version: form.version.trim(),
        title: form.title.trim(),
        content: form.content,
        status: "DRAFT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: null,
        ...created,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        {/* ── Modal top bar ── */}
        <div className={styles.modalTopBar}>
          <div className={styles.topBarLeft}>
            <span className={styles.envTag}>
              A2MATEX LEGAL CORE • STAGING ENVIRONMENT
            </span>
            <span className={styles.draftMode}>
              <span className={styles.draftDot} />
              DRAFT MODE
            </span>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* ── Modal header ── */}
        <div className={styles.modalHeader}>
          <h2>Draft New Terms &amp; Policy Version</h2>
        </div>

        {/* ── Form body ── */}
        <div className={styles.modalBody}>
          {/* Row 1: type + version */}
          <div className={styles.row2col}>
            <div className={styles.field}>
              <label className={styles.label}>
                POLICY DOCUMENT TYPE <span className={styles.required}>*</span>
              </label>
              <select
                className={`${styles.select} ${errors.type ? styles.inputError : ""}`}
                value={form.type}
                onChange={(e) => setField("type", e.target.value)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <span className={styles.errorMsg}>{errors.type}</span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                SEMANTIC VERSION TAG <span className={styles.required}>*</span>
              </label>
              <div className={styles.versionInputWrap}>
                <BsTagFill className={styles.versionIcon} size={13} />
                <input
                  type="text"
                  className={`${styles.input} ${styles.inputWithIcon} ${errors.version ? styles.inputError : ""}`}
                  placeholder="v1.1.0"
                  value={form.version}
                  onChange={(e) => setField("version", e.target.value)}
                />
              </div>
              {errors.version && (
                <span className={styles.errorMsg}>{errors.version}</span>
              )}
            </div>
          </div>

          {/* Row 2: title */}
          <div className={styles.field}>
            <label className={styles.label}>
              POLICY TITLE / IDENTIFIER{" "}
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.titleInputWrap}>
              <span className={styles.titleIcon}>T</span>
              <input
                type="text"
                className={`${styles.input} ${styles.inputWithIcon} ${errors.title ? styles.inputError : ""}`}
                placeholder="Term for Publishers - Stricter Anti-Malware Clause"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
              />
            </div>
            {errors.title && (
              <span className={styles.errorMsg}>{errors.title}</span>
            )}
          </div>

          {/* Row 3: content editor */}
          <div className={styles.field}>
            <label className={styles.label}>
              INITIAL POLICY CONTENT <span className={styles.required}>*</span>
            </label>
            <div
              className={`${styles.editorWrap} ${errors.content ? styles.editorError : ""}`}
            >
              <SummernoteEditor
                value={form.content}
                onChange={(html) => setField("content", html)}
                toolbar={TOOLBAR}
                colorScheme="dark"
                theme="lite"
                placeholder="Write your policy content here…"
                disableResize={false}
              />
            </div>
            {errors.content && (
              <span className={styles.errorMsg}>{errors.content}</span>
            )}
          </div>

          {/* Signed footer */}
          <div className={styles.signedRow}>
            <MdLock size={13} className={styles.lockIcon} />
            <span>
              Signed with Admin Key ID: <strong>A2-SEC-KEY-9941</strong>
              {user && (
                <span>
                  {" "}
                  ({user.fullName || user.email} •{" "}
                  {user.roleName || "SuperAdmin"})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* ── Modal footer ── */}
        <div className={styles.modalFooter}>
          <button
            className={styles.btnCancel}
            onClick={onClose}
            disabled={saving}
          >
            CANCEL / DISCARD
          </button>
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={saving}
          >
            <MdSave size={14} />
            {saving ? "Saving…" : "SAVE AS DRAFT"}
          </button>
        </div>
      </div>
    </div>
  );
}
