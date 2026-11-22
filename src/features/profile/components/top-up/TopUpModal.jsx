import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./TopUpModal.module.css";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import { topUpApi } from "../../api/topUpApi";
import axiosInstance from "@lib/axios";
import { getMeUrl } from "@/common/api/user/userUrl";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import { FiCopy, FiX } from "react-icons/fi";
import { userApi } from "@/common/api/user/userApi";
import {
  formatBalance,
  normalizeDecimalString,
} from "@/features/commerce/model/money";

const MAX_SAFE_AMOUNT = BigInt(Number.MAX_SAFE_INTEGER);

const TopUpModal = ({
  balance,
  onClose,
  onBalanceChanged,
  onTopUpSuccess,
}) => {
  const [amount, setAmount] = useState("");
  const [topUpData, setTopUpData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState(null);

  const pollIntervalRef = useRef(null);

  /* Build VietQR URL from topUpData */
  const vietqrUrl = topUpData
    ? `https://vietqr.app/img?${new URLSearchParams({
        acc: topUpData.bankAccountNumber,
        bank: topUpData.bankName,
        amount: String(topUpData.amount),
        des: topUpData.transferContent,
        template: "compact",
        showinfo: "true",
        holder: topUpData.accountHolderName,
      }).toString()}`
    : "";

  const startPolling = (initialBalance) => {
    setPolling(true);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await axiosInstance.get(getMeUrl);
        const newBalance = normalizeDecimalString(res.data.data.balance);
        if (newBalance !== normalizeDecimalString(initialBalance)) {
          clearInterval(pollIntervalRef.current);
          setPolling(false);
          try {
            await userApi.getMyProfile();
          } catch (profileError) {
            console.error("Balance refresh error:", profileError);
          }
          (onBalanceChanged ?? onTopUpSuccess)?.(newBalance);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 10000);
  };

  const handleSubmit = async () => {
    if (!/^\d+$/.test(amount) || BigInt(amount) <= 0n) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    const exactAmount = BigInt(amount);
    if (exactAmount > MAX_SAFE_AMOUNT) {
      setError("This amount is too large to submit safely.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const data = await topUpApi.createTopUp(Number(exactAmount));
      setTopUpData(data);
      startPolling(balance);
    } catch (err) {
      const raw = err?.response?.data?.message;
      let msg;
      if (Array.isArray(raw)) {
        msg = raw
          .map((item) => (typeof item === "object" ? item.message : item))
          .join(", ");
      } else {
        msg = raw || "Failed to create top-up request. Please try again.";
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    clearInterval(pollIntervalRef.current);
    onClose();
  }, [onClose]);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => clearInterval(pollIntervalRef.current);
  }, []);

  /* Escape key handler */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Top Up"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContain}>
            <span className={styles.balancePill}>
              YOUR BALANCE: {formatBalance(balance)} VND
            </span>
            <h2 className={styles.title}>Top-up To Your Account</h2>
          </div>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {error && <div className={styles.errorBox}>{error}</div>}

          {!topUpData && (
            <div className={styles.amountRow}>
              <Input
                label="AMOUNT"
                type="number"
                leftIcon={<MdOutlineAccountBalanceWallet size={14} />}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!!topUpData}
                placeholder="Enter amount (VND)"
                min="1"
                step="1"
              />
              <span className={styles.vndSuffix}>VND</span>
            </div>
          )}

          {/* QR section — shown after POST succeeds */}
          {topUpData && (
            <div className={styles.qrSection}>
              <p className={styles.qrLabel}>SCAN QR BELOW</p>
              <div className={styles.qrLayout}>
                <div className={styles.qrImageWrap}>
                  <img
                    src={vietqrUrl}
                    alt="VietQR payment code"
                    className={styles.qrImage}
                  />
                </div>
                <div className={styles.paymentInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Reference Code</span>
                    <span className={styles.infoValue}>
                      {topUpData.referenceCode}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Amount</span>
                    <span className={styles.infoValue}>
                      {formatBalance(topUpData.amount)} VND
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      Bank Account Number
                    </span>
                    <span className={styles.infoValue}>
                      {topUpData.bankAccountNumber}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Bank Name</span>
                    <span className={styles.infoValue}>
                      {topUpData.bankName}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      Account Holder Name
                    </span>
                    <span className={styles.infoValue}>
                      {topUpData.accountHolderName}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Transfer Content</span>
                    <span className={styles.infoValueCopy}>
                      {topUpData.transferContent}
                      <button
                        className={styles.copyBtn}
                        onClick={() =>
                          navigator.clipboard.writeText(
                            topUpData.transferContent,
                          )
                        }
                        aria-label="Copy transfer content"
                        title="Copy"
                      >
                        <FiCopy size={13} />
                      </button>
                    </span>
                  </div>
                </div>
              </div>
              {polling && (
                <p className={styles.pollingNote}>
                  ⟳ Waiting for payment confirmation…
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button
            variant="ghost"
            onClick={handleClose}
            leftIcon={<FiX size={14} />}
          >
            Cancel / Discard
          </Button>
          {!topUpData && (
            <Button
              variant="primary"
              className={styles.submitButton}
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting || !!topUpData}
              leftIcon={<MdOutlineAccountBalanceWallet size={14} />}
            >
              Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopUpModal;
