import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import styles from "../styles/AuthPage.module.css";
import Button from "../../../common/components/common/Button";
import Input from "../../../common/components/common/Input";

import { FiMonitor, FiUser, FiLock } from "react-icons/fi";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { authApi } from "../api/authApi";
import { getErrorMessage } from "../../../common/api/errorMessageHandler";

const MonitorIcon = (props) => <FiMonitor size={28} {...props} />;
const UserIcon = (props) => <FiUser size={16} {...props} />;
const LockIcon = (props) => <FiLock size={16} {...props} />;
const GitHubIcon = (props) => <FaGithub size={18} {...props} />;
const GoogleIcon = (props) => <FcGoogle size={18} {...props} />;
/* ── Validation ── */
const validate = ({ account, password }) => {
  const errors = {};
  if (!account.trim()) errors.account = "Vui lòng nhập tên người dùng.";
  if (!password) errors.password = "Vui lòng nhập mật khẩu.";
  return errors;
};

/* ── Component ── */
const LoginPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    account: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      const isAdmin = await authApi.login(form.account, form.password);
      navigate(isAdmin ? "/admin/permission-role" : "/");
    } catch (err) {
      console.error(err);
      const error = getErrorMessage({
        message: err?.response?.data?.message,
      });
      if (error.isFormError) {
        setErrors(error.data);
      } else {
        setServerError(error.data);
      }
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
        <p className={styles.subtitle}>
          Truy cập vào ứng dụng A2MaTeX Client Launcher
        </p>

        {/* Server error */}
        {serverError && (
          <div className={styles.serverError} role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <Input
            label="Tên người dùng (account)"
            name="account"
            autoComplete="account"
            placeholder="alex_dev99 hoặc account"
            leftIcon={<UserIcon />}
            value={form.account}
            onChange={handleChange}
            error={errors.account}
          />

          {/* Password label row with forgot link */}
          <div>
            <div className={styles.labelRow}>
              <span className={styles.passwordLabel}>MẬT KHẨU</span>
              <a href="#" className={styles.forgotLink}>
                Quên mật khẩu?
              </a>
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
          <Button
            variant="secondary"
            size="md"
            fullWidth
            leftIcon={<GoogleIcon />}
          >
            Google
          </Button>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            leftIcon={<GitHubIcon />}
          >
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
