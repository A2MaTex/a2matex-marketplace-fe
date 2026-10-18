import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import styles from "../styles/AuthPage.module.css";

import {
  FiUserPlus,
  FiUser,
  FiMail,
  FiLock,
  FiKey,
  FiShield,
} from "react-icons/fi";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { authApi } from "../api/authApi";
import { getErrorMessage } from "@lib/errorMessageHandler";

/* ── Icons ── */
const UserPlusIcon = (props) => <FiUserPlus size={28} {...props} />;
const UserIcon = (props) => <FiUser size={16} {...props} />;
const MailIcon = (props) => <FiMail size={16} {...props} />;
const LockIcon = (props) => <FiLock size={16} {...props} />;
const RefreshLockIcon = (props) => <FiKey size={16} {...props} />;
const ShieldCheckIcon = (props) => <FiShield size={16} {...props} />;
const GitHubIcon = (props) => <FaGithub size={18} {...props} />;
const GoogleIcon = (props) => <FcGoogle size={18} {...props} />;

/* ── Validation ── */
const validate = ({
  fullName,
  username,
  email,
  password,
  confirmPassword,
  code,
}) => {
  const errors = {};
  if (!fullName.trim()) errors.fullName = "Please enter your full name.";
  else if (!/^[A-Za-z ]{3,50}$/.test(fullName))
    errors.fullName =
      "Full name must be 3-50 characters long and contain only letters and spaces.";

  if (!username.trim()) errors.username = "Please enter your username.";
  else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    errors.username =
      "Username must be 3-20 characters long and contain only letters, numbers, and underscores.";

  if (!email.trim()) errors.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Invalid email address.";

  if (!password) errors.password = "Please enter your password.";
  else if (password.length < 8)
    errors.password = "Password must be at least 8 characters long.";

  if (!confirmPassword)
    errors.confirmPassword = "Please confirm your password.";
  else if (password !== confirmPassword)
    errors.confirmPassword = "Passwords do not match.";

  if (!code.trim()) errors.code = "Please enter OTP.";
  else if (!/^\d{6}$/.test(code.trim())) errors.code = "OTP must be 6 digits.";

  return errors;
};

/* ── Component ── */
const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    code: "",
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

  const startCooldown = (seconds = 300) => {
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
      setErrors((prev) => ({
        ...prev,
        email: "Nhập email hợp lệ trước khi gửi OTP.",
      }));
      return;
    }
    setOtpSending(true);
    try {
      await authApi.sendOtp({ email: form.email });
      startCooldown(300);
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
      setOtpSending(false);
    }
  };

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
      await authApi.register(form);
      navigate("/login");
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
            label="Full Name"
            hint="Enter your full name"
            name="fullName"
            autoComplete="fullName"
            placeholder="alex_automation"
            leftIcon={<UserIcon />}
            value={form.fullName}
            onChange={handleChange}
            error={errors.fullName}
          />

          <Input
            label="Username"
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
            label="Email address"
            hint="Enter your email address"
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
            label="Password"
            hint="Enter your password"
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
            label="Confirm password"
            hint="Enter your password again"
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
                label="OTP"
                hint="Send to your mail"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="_ _ _ _ _ _"
                leftIcon={<ShieldCheckIcon />}
                value={form.code}
                onChange={handleChange}
                error={errors.code}
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
                {otpCooldown > 0 ? `${otpCooldown}s` : "Send OTP"}
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
                I agree with{" "}
                <a href="#" className={styles.link}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className={styles.link}>
                  Privacy Policy
                </a>{" "}
                of A2MaTeX.
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
            Create Account
          </Button>
        </form>

        {/* Divider */}
        <div className={styles.divider}>
          <span>Or continue with</span>
        </div>

        {/* Social buttons */}
        <div className={styles.socialRow}>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            leftIcon={<GitHubIcon />}
          >
            GitHub
          </Button>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            leftIcon={<GoogleIcon />}
          >
            Google
          </Button>
        </div>

        {/* Switch to login */}
        <p className={styles.switchText}>
          Already have an account?{" "}
          <Link to="/login" className={styles.switchLink}>
            Login →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
