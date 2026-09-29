import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import styles from "./AuthPage.module.css";

/* ── Icons ── */
const MonitorIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
    <circle cx="12" cy="10" r="2" fill="currentColor" stroke="none" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
const validate = ({ username, password }) => {
  const errors = {};
  if (!username.trim()) errors.username = "Vui lòng nhập tên người dùng.";
  if (!password) errors.password = "Vui lòng nhập mật khẩu.";
  return errors;
};

/* ── Component ── */
const LoginPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

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
      // TODO: call authApi.login(form)
      navigate("/");
    } catch (err) {
      setServerError(err?.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Avatar icon */}
        <div className={styles.avatarWrap}>
          <MonitorIcon />
        </div>

        {/* Heading */}
        <h1 className={styles.title}>Đăng Nhập</h1>
        <p className={styles.subtitle}>Truy cập vào ứng dụng A2MaTeX Client Launcher</p>

        {/* Server error */}
        {serverError && (
          <div className={styles.serverError} role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <Input
            label="Tên người dùng (Username)"
            name="username"
            autoComplete="username"
            placeholder="alex_dev99 hoặc username"
            leftIcon={<UserIcon />}
            value={form.username}
            onChange={handleChange}
            error={errors.username}
          />

          {/* Password label row with forgot link */}
          <div>
            <div className={styles.labelRow}>
              <span className={styles.passwordLabel}>MẬT KHẨU</span>
              <a href="#" className={styles.forgotLink}>Quên mật khẩu?</a>
            </div>
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••••"
              leftIcon={<LockIcon />}
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />
          </div>

          {/* Remember me */}
          <label className={styles.rememberLabel}>
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleChange}
              className={styles.checkbox}
            />
            <span>Ghi nhớ đăng nhập trên thiết bị này</span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            rightIcon={!loading && <span>→</span>}
          >
            Đăng Nhập
          </Button>
        </form>

        {/* Divider */}
        <div className={styles.divider}>
          <span>Hoặc đăng nhập nhanh</span>
        </div>

        {/* Social buttons */}
        <div className={styles.socialRow}>
          <Button variant="secondary" size="md" fullWidth leftIcon={<GoogleIcon />}>
            Google
          </Button>
          <Button variant="secondary" size="md" fullWidth leftIcon={<GitHubIcon />}>
            GitHub
          </Button>
        </div>

        {/* Switch to register */}
        <p className={styles.switchText}>
          Chưa có tài khoản A2MaTeX?{" "}
          <Link to="/register" className={styles.switchLink}>
            Đăng ký ngay →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
