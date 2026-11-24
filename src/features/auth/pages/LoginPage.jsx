import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import styles from "../styles/AuthPage.module.css";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import AuthPageLayout from "../components/AuthPageLayout";

import { FiUser, FiLock } from "react-icons/fi";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { authApi } from "../api/authApi";
import { ERROR_MESSAGES, getErrorMessage } from "@lib/errorMessageHandler";
import { useSocialLogin } from "../hooks/useSocialLogin";
import { isAccountUsesSocialLoginError } from "../api/socialLoginErrors";
import { getSafeReturnTo } from "../api/safeReturnTo";
import { userApi } from "@api/user/userApi";
import ROLE from "@/constants/roles";

const ACCOUNT_USES_SOCIAL_LOGIN_MESSAGE =
  "This account uses social sign-in. Choose Google or GitHub below.";
const NETWORK_ERROR =
  "We could not reach the server. Check your connection and try again.";

const ADMIN_HOME = "/admin/permission-role";

const UserIcon = (props) => <FiUser size={16} {...props} />;
const LockIcon = (props) => <FiLock size={16} {...props} />;
const GitHubIcon = (props) => <FaGithub size={18} {...props} />;
const GoogleIcon = (props) => <FcGoogle size={18} {...props} />;
/* ── Validation ── */
const validate = ({ account, password }) => {
  const errors = {};
  if (!account.trim()) errors.account = "Enter your username or email.";
  if (!password) errors.password = "Enter your password.";
  return errors;
};

/* ── Component ── */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = getSafeReturnTo(location.search);
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    account: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const socialLogin = useSocialLogin(returnTo);
  const [serverError, setServerError] = useState(
    searchParams.get("reason") === "session-expired"
      ? ERROR_MESSAGES["Error.SessionExpired"]
      : "",
  );

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
      await authApi.login(form.account, form.password);
      let isAdmin = false;
      try {
        const { user } = await userApi.getMyProfile({ forceRefresh: true });
        isAdmin = Boolean(
          user.roles?.some((role) => role.name === ROLE.ADMIN),
        );
      } catch {
        // DEF-008
      }
      navigate(isAdmin ? ADMIN_HOME : "/");
    } catch (err) {
      console.error(err);
      if (isAccountUsesSocialLoginError(err)) {
        setServerError(ACCOUNT_USES_SOCIAL_LOGIN_MESSAGE);
        return;
      }

      const error = getErrorMessage({
        message: err?.response?.data?.message,
      });
      // getErrorMessage returns null when the request never reached the backend.
      if (!error) {
        setServerError(NETWORK_ERROR);
        return;
      }
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
    <AuthPageLayout
      eyebrow="A2MATEX · ANDROID AUTOMATION PLATFORM"
      headline="Find the workflow."
      highlight="Keep the momentum."
      description="Sign in to explore published workflows, build in Studio, and run them with Launcher."
    >
      <section className={styles.card} aria-labelledby="login-title">
        <div className={styles.cardEyebrow}>
          <span className={styles.cardEyebrowDot} />
          MEMBER ACCESS
        </div>
        <h2 className={styles.title} id="login-title">Welcome back</h2>
        <p className={styles.subtitle}>
          Sign in to continue to your A2MaTeX workspace.
        </p>

        {/* Server error */}
        {serverError && (
          <div className={styles.serverError} role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <Input
            label="Username or email"
            name="account"
            autoComplete="username"
            leftIcon={<UserIcon />}
            value={form.account}
            onChange={handleChange}
            error={errors.account}
          />

          {/* Password label row with forgot link */}
          <div>
            <div className={styles.labelRow}>
              <span className={styles.passwordLabel}>PASSWORD</span>
              <Link to="/auth/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
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
            <span>Remember me on this device</span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            className={styles.authSubmitButton}
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className={styles.divider}>
          <span>OR CONTINUE WITH</span>
        </div>

        {/* Social buttons */}
        <div className={styles.socialRow}>
          <Button
            variant="secondary"
            className={styles.socialButton}
            size="md"
            fullWidth
            leftIcon={<GoogleIcon />}
            loading={socialLogin.pendingProvider === "google"}
            disabled={Boolean(socialLogin.pendingProvider)}
            onClick={() => socialLogin.startLogin("google")}
          >
            Google
          </Button>
          <Button
            variant="secondary"
            className={styles.socialButton}
            size="md"
            fullWidth
            leftIcon={<GitHubIcon />}
            loading={socialLogin.pendingProvider === "github"}
            disabled={Boolean(socialLogin.pendingProvider)}
            onClick={() => socialLogin.startLogin("github")}
          >
            GitHub
          </Button>
        </div>
        {socialLogin.error && (
          <div className={styles.serverError} role="alert">
            {socialLogin.error}
          </div>
        )}

        {/* Switch to register */}
        <p className={styles.switchText}>
          New to A2MaTeX?{" "}
          <Link to="/register" className={styles.switchLink}>
            Create an account →
          </Link>
        </p>
      </section>
    </AuthPageLayout>
  );
};

export default LoginPage;
