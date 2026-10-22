import { useEffect, useState } from "react";
import { BsRocketTakeoff, BsXLg, BsCheckLg, BsFileText } from "react-icons/bs";
import { FiRefreshCw, FiAlertTriangle } from "react-icons/fi";
import { termApi } from "@/features/term/termApi";
import { profileApi } from "../api/profileApi";
import styles from "./ActivatePublisherModal.module.css";
import TERM_TYPE from "@/constants/term";

/**
 * Props:
 *  onSuccess() — called after activation succeeds
 *  onClose()   — called to close the modal
 */
const ActivatePublisherModal = ({ onSuccess, onClose }) => {
  const [term, setTerm] = useState(null);
  const [loadingTerm, setLoadingTerm] = useState(true);
  const [termError, setTermError] = useState("");

  const [accepted, setAccepted] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState("");

  /* fetch current term on mount */
  useEffect(() => {
    const fetchTerm = async () => {
      try {
        setLoadingTerm(true);
        const res = await termApi.getCurrentTerms(TERM_TYPE.PUBLISHER_TERMS);
        setTerm(res.data?.data ?? res.data);
      } catch (err) {
        const msg =
          err?.response?.data?.message || "Không thể tải điều khoản. Vui lòng thử lại.";
        setTermError(msg);
      } finally {
        setLoadingTerm(false);
      }
    };
    fetchTerm();
  }, []);

  const handleActivate = async () => {
    if (!accepted || !term?.id) return;
    setActivating(true);
    setActivateError("");
    try {
      await profileApi.activatePublisherAccount(term.id);
      onSuccess();
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Kích hoạt thất bại. Vui lòng thử lại.";
      setActivateError(msg);
    } finally {
      setActivating(false);
    }
  };

  const formattedDate = term?.publishedAt
    ? new Date(term.publishedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="pub-modal-title">
        {/* ── Header ── */}
        <div className={styles.header}>
          <span className={styles.headerTitle} id="pub-modal-title">
            <BsRocketTakeoff size={14} /> Activate Publisher Role
          </span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            disabled={activating}
          >
            <BsXLg size={13} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          {loadingTerm ? (
            <div className={styles.loadingState}>
              <FiRefreshCw size={22} className={styles.spinIcon} />
              <span>Loading terms…</span>
            </div>
          ) : termError ? (
            <div className={styles.errorState}>
              <FiAlertTriangle size={18} />
              <span>{termError}</span>
            </div>
          ) : (
            <>
              {/* Term meta */}
              <div className={styles.termMeta}>
                <BsFileText size={13} />
                <span className={styles.termTitle}>{term.title}</span>
                {term.version && (
                  <span className={styles.termVersion}>{term.version}</span>
                )}
                {formattedDate && (
                  <span className={styles.termDate}>Published {formattedDate}</span>
                )}
              </div>

              {/* Term content */}
              <div className={styles.termContent}>
                <p>{term.content}</p>
              </div>

              {/* Checkbox */}
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  disabled={activating}
                />
                <span className={styles.checkboxText}>
                  I have read and agree to the platform's terms and conditions
                </span>
              </label>

              {/* Activate error */}
              {activateError && (
                <p className={styles.errorMsg}>
                  <FiAlertTriangle size={12} /> {activateError}
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <button
            className={styles.btnGhost}
            onClick={onClose}
            disabled={activating}
          >
            Cancel
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleActivate}
            disabled={!accepted || activating || loadingTerm || !!termError}
          >
            {activating ? (
              <>
                <FiRefreshCw size={13} className={styles.spinIcon} /> Activating…
              </>
            ) : (
              <>
                <BsCheckLg size={13} /> Confirm &amp; Activate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivatePublisherModal;
