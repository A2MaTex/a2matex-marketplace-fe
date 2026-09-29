import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import styles from "./AuthPage.module.css";

/* ── Icons ── */
const UserPlusIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const RefreshLockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <rect x="3" y="13" width="18" height="9" rx="2" />
    <path d="M7 13V9a5 5 0 0 1 9.33-2.5" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

/* ── Validation ── */
const validate = ({ username, email, password, confirmPassword, otp, agreed }) => {
  const errors = {};
  if (!username.trim()) errors.username = "Vui lòng nhập tên người dùng.";
  else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    errors.username = "Chỉ gồm A-Z, 0-9, _ và 3–20 ký tự.";

  if (!email.trim()) errors.email = "Vui lòng nhập địa chỉ email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Email không hợp lệ.";

  if (!password) errors.password = "Vui lòng nhập mật khẩu.";
  else if (password.length < 8)
    errors.password = "Mật khẩu tối thiểu 8 ký tự.";

  if (!confirmPassword) errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
  else if (password !== confirmPassword)
    errors.confirmPassword = "Mật khẩu không khớp.";

  if (!otp.trim()) errors.otp = "Vui lòng nhập mã OTP.";
  else if (!/^\d{4,8}$/.test(otp.trim()))
    errors.otp = "OTP gồm 4–8 chữ số.";

  if (!agreed) errors.agreed = "Bạn cần đồng ý với điều khoản.";

  return errors;
};

/* ── Component ── */
const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
    agreed: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // OTP cooldown: countdown in seconds (0 = can send)
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpSending, setOtpSending] = useState(false);
  const cooldownRef = useRef(null);

  // Clear interval on unmount
  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const startCooldown = (seconds = 60) => {
    setOtpCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrors((prev) => ({ ...prev, email: "Nhập email hợp lệ trước khi gửi OTP." }));
      return;
    }
    setOtpSending(true);
    try {
      // TODO: call authApi.sendOtp(form.email)
      startCooldown(60);
    } catch {
      setErrors((prev) => ({ ...prev, otp: "Gửi OTP thất bại. Vui lòng thử lại." }));
    } finally {
      setOtpSending(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // TODO: call authApi.register(form)
      navigate("/login");
    } catch (err) {
      setServerError(err?.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Avatar icon */}
        <div className={styles.avatarWrap}>
          <UserPlusIcon />
        </div>

        {/* Heading */}
        <h1 className={styles.title}>Tạo Tài Khoản A2MaTeX</h1>
        <p className={styles.subtitle}>
          Đăng ký nhanh để kích hoạt Client Launcher &amp; bảo mật HWID
        </p>

        {/* Server error */}
        {serverError && (
          <div className={styles.serverError} role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <Input
            label="Tên người dùng (Username)"
            hint="A-Z, 0-9, _"
            name="username"
            autoComplete="username"
            placeholder="alex_automation"
            leftIcon={<UserIcon />}
            value={form.username}
            onChange={handleChange}
            error={errors.username}
          />

          <Input
            label="Địa chỉ Email"
            hint="Kích hoạt & Thông báo"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="alex@domain.vn"
            leftIcon={<MailIcon />}
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />

          <Input
            label="Mật khẩu"
            hint="Tối thiểu 8 ký tự"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            leftIcon={<LockIcon />}
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          <Input
            label="Xác nhận mật khẩu"
            hint="Nhập lại khớp nhau"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            leftIcon={<RefreshLockIcon />}
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          {/* OTP row */}
          <div className={styles.otpRow}>
            <div className={styles.otpInputWrap}>
              <Input
                label="Mã OTP"
                hint="Gửi đến email"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="_ _ _ _ _ _"
                leftIcon={<ShieldCheckIcon />}
                value={form.otp}
                onChange={handleChange}
                error={errors.otp}
                maxLength={8}
              />
            </div>
            <div className={styles.otpBtnWrap}>
              <Button
                type="button"
                variant="ghost"
                size="md"
                loading={otpSending}
                disabled={otpCooldown > 0 || otpSending}
                onClick={handleSendOtp}
              >
                {otpCooldown > 0 ? `${otpCooldown}s` : "Gửi OTP"}
              </Button>
            </div>
          </div>

          {/* Terms checkbox */}
          <div className={styles.checkboxRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="agreed"
                checked={form.agreed}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span>
                Tôi đồng ý với{" "}
                <a href="#" className={styles.link}>Điều khoản dịch vụ</a>{" "}
                và{" "}
                <a href="#" className={styles.link}>Chính sách bảo mật HWID</a>{" "}
                của A2MaTeX.
              </span>
            </label>
            {errors.agreed && (
              <span className={styles.checkboxError} role="alert">
                {errors.agreed}
              </span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            rightIcon={!loading && <span>→</span>}
          >
            Hoàn Tất Đăng Ký
          </Button>
        </form>

        {/* Divider */}
        <div className={styles.divider}>
          <span>Hoặc tiếp tục với</span>
        </div>

        {/* Social buttons */}
        <div className={styles.socialRow}>
          <Button variant="secondary" size="md" fullWidth leftIcon={<GitHubIcon />}>
            GitHub
          </Button>
          <Button variant="secondary" size="md" fullWidth leftIcon={<GoogleIcon />}>
            Google
          </Button>
        </div>

        {/* Switch to login */}
        <p className={styles.switchText}>
          Đã có tài khoản A2MaTeX?{" "}
          <Link to="/login" className={styles.switchLink}>
            Đăng nhập ngay →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
