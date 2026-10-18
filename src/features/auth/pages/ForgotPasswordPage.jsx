import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import styles from "../styles/ForgotPasswordPage.module.css";
import sharedStyles from "../styles/AuthPage.module.css";
import Input from "@components/common/Input";
import Button from "@components/common/Button";
import { authApi } from "../api/authApi";
import { getErrorMessage } from "@lib/errorMessageHandler";

import { FiMail, FiLock, FiShield, FiArrowLeft } from "react-icons/fi";
import { BsShieldLock } from "react-icons/bs";
import { RiLockPasswordLine } from "react-icons/ri";

/* ── OTP input box ── */
const OTP_LENGTH = 6;

const OtpInput = ({ value, onChange, disabled }) => {
  const inputsRef = useRef([]);

  const digits = value
    .split("")
    .concat(Array(OTP_LENGTH).fill(""))
    .slice(0, OTP_LENGTH);

  const handleKey = (e, idx) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = value.slice(0, idx) + value.slice(idx + 1);
      onChange(next);
      if (idx > 0) inputsRef.current[idx - 1]?.focus();
      return;
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
      return;
    }
    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
      return;
    }
  };

  const handleInput = (e, idx) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;
    // support paste
    if (raw.length > 1) {
      const filled = (value.slice(0, idx) + raw).slice(0, OTP_LENGTH);
      onChange(filled);
      const nextFocus = Math.min(idx + raw.length, OTP_LENGTH - 1);
      inputsRef.current[nextFocus]?.focus();
      return;
    }
    const next = value.slice(0, idx) + raw + value.slice(idx + 1);
    onChange(next.slice(0, OTP_LENGTH));
    if (idx < OTP_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    onChange(
      pasted.padEnd(OTP_LENGTH, "").slice(0, OTP_LENGTH).replace(/\s/g, ""),
    );
    const go = Math.min(pasted.length, OTP_LENGTH - 1);
    inputsRef.current[go]?.focus();
  };

  return (
    <div className={styles.otpRow}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          className={`${styles.otpBox} ${d ? styles.otpBoxFilled : ""}`}
          onChange={(e) => handleInput(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
};

/* ── Resend countdown ── */
const RESEND_SECONDS = 60;

const useCountdown = (active) => {
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  useEffect(() => {
    if (!active) return;
    setSeconds(RESEND_SECONDS);
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active]);
  return seconds;
};

/* ════════════════════════════════════════════════════════════════
   STEP 1 — Enter email
════════════════════════════════════════════════════════════════ */
const StepEmail = ({ onNext }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim()) return "Vui lòng nhập địa chỉ email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email không hợp lệ.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    try {
      await authApi.sendOtp({ email, type: "FORGOT_PASSWORD" });
      onNext(email);
    } catch (ex) {
      const parsed = getErrorMessage({ message: ex?.response?.data?.message });
      setServerError(
        parsed.isFormError
          ? Object.values(parsed.data).join(", ")
          : parsed.data,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={sharedStyles.card}>
      <div className={sharedStyles.avatarWrap}>
        <FiMail size={26} />
      </div>
      <h1 className={sharedStyles.title}>FORGOT PASSWORD</h1>
      <p className={sharedStyles.subtitle}>
        Enter your email to receive an OTP code.
      </p>

      {serverError && (
        <div className={sharedStyles.serverError}>{serverError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate className={sharedStyles.form}>
        <Input
          label="EMAIL"
          hint="Enter your email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          leftIcon={<FiMail size={15} />}
          placeholder="your@email.com"
          error={error}
          autoFocus
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          rightIcon={!loading && <span>→</span>}
        >
          SEND OTP
        </Button>
      </form>

      <p className={sharedStyles.switchText}>
        Remember password?{" "}
        <Link to="/login" className={sharedStyles.switchLink}>
          Login now →
        </Link>
      </p>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   STEP 2 — Enter OTP
════════════════════════════════════════════════════════════════ */
const StepOtp = ({ email, onNext, onBack }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdownActive, setCountdownActive] = useState(true);
  const seconds = useCountdown(countdownActive);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (otp.length < OTP_LENGTH) {
      setError("Vui lòng nhập đủ 6 chữ số OTP.");
      return;
    }

    setLoading(true);
    try {
      // We just validate the OTP exists — actual verification happens on step 3
      onNext(otp);
    } catch (ex) {
      const parsed = getErrorMessage({ message: ex?.response?.data?.message });
      setServerError(
        parsed.isFormError
          ? Object.values(parsed.data).join(", ")
          : parsed.data,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setServerError("");
    try {
      await authApi.sendOtp({ email, type: "FORGOT_PASSWORD" });
      setCountdownActive((v) => !v); // toggle to restart effect
      setTimeout(() => setCountdownActive((v) => !v), 0);
      setOtp("");
      setError("");
    } catch (ex) {
      const parsed = getErrorMessage({ message: ex?.response?.data?.message });
      setServerError(
        parsed.isFormError
          ? Object.values(parsed.data).join(", ")
          : parsed.data,
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={sharedStyles.card}>
      <div className={sharedStyles.avatarWrap}>
        <FiShield size={26} />
      </div>
      <h1 className={sharedStyles.title}>FORGOT PASSWORD</h1>
      <p className={sharedStyles.subtitle}>
        Enter the 6-digit OTP sent to{" "}
        <strong className={styles.emailHighlight}>{email}</strong>
      </p>

      {serverError && (
        <div className={sharedStyles.serverError}>{serverError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate className={sharedStyles.form}>
        <div>
          <OtpInput
            value={otp}
            onChange={(v) => {
              setOtp(v);
              setError("");
            }}
            disabled={loading}
          />
          {error && <p className={styles.otpError}>{error}</p>}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          rightIcon={!loading && <span>→</span>}
        >
          SUBMIT
        </Button>
      </form>

      <p className={sharedStyles.switchText}>
        {seconds > 0 ? (
          <>
            The resend code will be available after{" "}
            <strong className={styles.countdown}>{seconds}s</strong>
          </>
        ) : (
          <button
            className={styles.resendBtn}
            onClick={handleResend}
            disabled={resending}
            type="button"
          >
            {resending ? "Đang gửi…" : "Resend OTP →"}
          </button>
        )}
      </p>

      <button className={styles.backBtn} onClick={onBack} type="button">
        <FiArrowLeft size={13} /> Back
      </button>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   STEP 3 — New password
════════════════════════════════════════════════════════════════ */
const StepNewPassword = ({ email, otp, onBack }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPassword: "", confirmNewPassword: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.newPassword || form.newPassword.length < 6)
      errs.newPassword = "Mật khẩu mới tối thiểu 6 ký tự.";
    if (form.newPassword !== form.confirmNewPassword)
      errs.confirmNewPassword = "Xác nhận mật khẩu không khớp.";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({
        email,
        code: otp,
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmNewPassword,
      });
      navigate("/login", { state: { resetSuccess: true } });
    } catch (ex) {
      const parsed = getErrorMessage({ message: ex?.response?.data?.message });
      if (parsed.isFormError) setErrors(parsed.data);
      else setServerError(parsed.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={sharedStyles.card}>
      <div className={sharedStyles.avatarWrap}>
        <RiLockPasswordLine size={26} />
      </div>
      <h1 className={sharedStyles.title}>RESET PASSWORD</h1>
      <p className={sharedStyles.subtitle}>Enter your new password below.</p>

      {serverError && (
        <div className={sharedStyles.serverError}>{serverError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate className={sharedStyles.form}>
        <Input
          label="PASSWORD"
          hint="Enter your password"
          name="newPassword"
          type="password"
          value={form.newPassword}
          onChange={handleChange}
          leftIcon={<FiLock size={15} />}
          placeholder="Min. 6 characters"
          error={errors.newPassword}
          autoFocus
        />
        <Input
          label="RETYPE PASSWORD"
          hint="Retype your password"
          name="confirmNewPassword"
          type="password"
          value={form.confirmNewPassword}
          onChange={handleChange}
          leftIcon={<BsShieldLock size={15} />}
          placeholder="Repeat new password"
          error={errors.confirmNewPassword}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          rightIcon={!loading && <span>→</span>}
        >
          SUBMIT
        </Button>
      </form>

      <button className={styles.backBtn} onClick={onBack} type="button">
        <FiArrowLeft size={13} /> Back
      </button>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   Root page — orchestrates 3 steps
════════════════════════════════════════════════════════════════ */
const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1 | 2 | 3
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const goStep2 = (resolvedEmail) => {
    setEmail(resolvedEmail);
    setStep(2);
  };
  const goStep3 = (resolvedOtp) => {
    setOtp(resolvedOtp);
    setStep(3);
  };

  return (
    <div className={sharedStyles.page}>
      {/* Step indicator */}
      <div className={styles.stepIndicator}>
        {[1, 2, 3].map((n) => (
          <div key={n} className={styles.stepDotWrap}>
            <div
              className={`${styles.stepDot} ${step === n ? styles.stepDotActive : step > n ? styles.stepDotDone : ""}`}
            >
              {step > n ? "✓" : n}
            </div>
            {n < 3 && (
              <div
                className={`${styles.stepLine} ${step > n ? styles.stepLineDone : ""}`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && <StepEmail onNext={goStep2} />}
      {step === 2 && (
        <StepOtp email={email} onNext={goStep3} onBack={() => setStep(1)} />
      )}
      {step === 3 && (
        <StepNewPassword email={email} otp={otp} onBack={() => setStep(2)} />
      )}
    </div>
  );
};

export default ForgotPasswordPage;
