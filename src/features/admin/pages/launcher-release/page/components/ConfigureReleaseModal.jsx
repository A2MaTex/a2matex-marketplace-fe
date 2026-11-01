import { useState } from "react";
import { MdCheck, MdClose } from "react-icons/md";
import { BsTagFill } from "react-icons/bs";
import { FiFileText } from "react-icons/fi";
import { releaseApi } from "../../api/api";
import styles from "./ConfigureReleaseModal.module.css";

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function ConfigureReleaseModal({ staticFile, onClose, onCreated }) {
  const [version, setVersion] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!version.trim()) {
      setError("Version tag is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await releaseApi.createRelease({
        version: version.trim(),
        staticId: staticFile.staticId,
        releaseNotes: releaseNotes.trim(),
      });
      const created = res?.data?.data ?? res?.data ?? {};
      onCreated(created);
    } catch (err) {
      setError(
        err?.response?.data?.message ?? "Failed to register release. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalIcon}>
              <FiFileText size={16} />
            </div>
            <div>
              <div className={styles.modalTitle}>Configure New Launcher Release</div>
              <div className={styles.modalSub}>Draft artifact registered &amp; staged</div>
            </div>
          </div>
          <span className={styles.draftBadge}>DRAFT</span>
        </div>

        {/* Version field */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>RELEASE VERSION TAG</label>
            <span className={styles.fieldHint}>SERVER REQUIRED</span>
          </div>
          <div className={styles.versionInputWrap}>
            <BsTagFill className={styles.versionIcon} size={13} />
            <input
              className={styles.versionInput}
              type="text"
              placeholder="v2.5.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Release notes */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>CHANGELOG &amp; RELEASE NOTES</label>
            <span className={styles.fieldHint}>MARKDOWN ENABLED</span>
          </div>
          <textarea
            className={styles.textarea}
            placeholder={`### What's New in ${version || "vX.X.X"}:\n- Feature or fix description\n- Performance improvements\n- Security patches`}
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            rows={7}
          />
        </div>

        {/* Error */}
        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* File info */}
        <div className={styles.fileInfo}>
          <div className={styles.fileInfoRow}>
            <span className={styles.fileInfoLabel}>BINARY FILE:</span>
            <span className={styles.fileInfoValue}>{staticFile.originalFileName ?? "—"}</span>
          </div>
          <div className={styles.fileInfoRow}>
            <span className={styles.fileInfoLabel}>PAYLOAD SIZE:</span>
            <span className={styles.fileInfoValue}>
              {staticFile.size != null
                ? `${staticFile.size?.toLocaleString()} bytes (${formatBytes(staticFile.size)})`
                : "—"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={saving || !version.trim()}
          >
            <MdCheck size={16} />
            {saving ? "Saving…" : "Save & Register Release"}
          </button>
        </div>
      </div>
    </div>
  );
}
