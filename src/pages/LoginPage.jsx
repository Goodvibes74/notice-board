import { useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const navigate = useNavigate();

  // Handle HTML document theme change
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Clean error when switching tabs
  useEffect(() => {
    setError("");
    setPassword("");
    setUsername("");
  }, [isRegister]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (isRegister && !username.trim())) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(userCredential.user, { displayName: username.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      navigate("/board");
    } catch (err) {
      // Clean up Firebase error messages for display
      let message = err.message;
      if (err.code === "auth/invalid-credential") {
        message = "Incorrect email address or password.";
      } else if (err.code === "auth/email-already-in-use") {
        message = "An account with this email already exists.";
      } else if (err.code === "auth/weak-password") {
        message = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Next theme cycler
  function toggleTheme() {
    const themes = ["dark", "light", "cyberpunk"];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }

  return (
    <div style={styles.container}>
      {/* Background decoration */}
      <div className="glow-blob blob-1"></div>
      <div className="glow-blob blob-2"></div>
      <div className="glow-mesh"></div>

      {/* Floating Theme Selector */}
      <div style={styles.themeSelector}>
        <button 
          onClick={toggleTheme} 
          className="btn-secondary" 
          style={styles.themeBtn}
          title={`Active Theme: ${theme}. Click to switch.`}
          id="theme-toggle-btn"
        >
          {theme === "light" ? (
            <svg style={styles.iconInline} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
          ) : theme === "cyberpunk" ? (
            <svg style={styles.iconInline} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M13 12a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
          ) : (
            <svg style={styles.iconInline} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          )}
          <span style={{ textTransform: "capitalize", fontSize: "0.8rem" }}>{theme}</span>
        </button>
      </div>

      <div className="glass-panel animate-fade-in" style={styles.card}>
        {/* Brand/Header */}
        <div style={styles.header}>
          <div style={styles.logoCircle}>
            <svg style={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M9 12h6" />
              <path d="M9 16h6" />
            </svg>
          </div>
          <h1 style={styles.title}>NoticeBoard</h1>
          <p style={styles.subtitle}>Collaborate and share notes in real time</p>
        </div>

        {/* Tab Switcher */}
        <div style={styles.tabContainer}>
          <button
            onClick={() => setIsRegister(false)}
            style={{
              ...styles.tab,
              color: !isRegister ? "var(--text-primary)" : "var(--text-tertiary)",
              borderBottom: !isRegister ? "2px solid var(--primary-accent)" : "2px solid transparent",
            }}
            id="tab-signin"
          >
            Sign In
          </button>
          <button
            onClick={() => setIsRegister(true)}
            style={{
              ...styles.tab,
              color: isRegister ? "var(--text-primary)" : "var(--text-tertiary)",
              borderBottom: isRegister ? "2px solid var(--primary-accent)" : "2px solid transparent",
            }}
            id="tab-register"
          >
            Register
          </button>
        </div>

        {/* Error Dialog */}
        {error && (
          <div style={styles.errorContainer} className="animate-fade-in">
            <svg style={styles.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <div style={styles.inputWrapper} className="animate-fade-in">
              <span style={styles.inputIcon}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                className="modern-input"
                style={styles.paddedInput}
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={isRegister}
                id="input-username"
              />
            </div>
          )}

          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </span>
            <input
              className="modern-input"
              style={styles.paddedInput}
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              id="input-email"
            />
          </div>

          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <input
              className="modern-input"
              style={styles.paddedInputPassword}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="input-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.togglePasswordBtn}
              title={showPassword ? "Hide password" : "Show password"}
              id="password-visibility-toggle"
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            className="btn-modern btn-primary"
            style={styles.submitBtn}
            disabled={loading}
            id="auth-submit-btn"
          >
            {loading ? (
              <div className="spinner"></div>
            ) : (
              <>
                <span>{isRegister ? "Create Account" : "Sign In"}</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    position: "relative",
  },
  themeSelector: {
    position: "absolute",
    top: "20px",
    right: "20px",
    zIndex: 10,
  },
  themeBtn: {
    padding: "8px 12px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
  },
  iconInline: {
    width: "14px",
    height: "14px",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "2.5rem 2rem",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    borderWidth: "1px",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  logoCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "rgba(var(--primary-accent-rgb), 0.15)",
    border: "1px solid rgba(var(--primary-accent-rgb), 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
    color: "var(--primary-accent)",
  },
  logoIcon: {
    width: "22px",
    height: "22px",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
  },
  tabContainer: {
    display: "flex",
    borderBottom: "1px solid var(--border-color)",
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    background: "transparent",
    border: "none",
    fontFamily: "var(--font-heading)",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    textAlign: "center",
    outline: "none",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  paddedInput: {
    paddingLeft: "42px",
  },
  paddedInputPassword: {
    paddingLeft: "42px",
    paddingRight: "42px",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-tertiary)",
    display: "flex",
    alignItems: "center",
  },
  togglePasswordBtn: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "var(--text-tertiary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 0,
  },
  submitBtn: {
    width: "100%",
    marginTop: "6px",
  },
  errorContainer: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    padding: "10px 12px",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
  },
  errorIcon: {
    width: "16px",
    height: "16px",
    color: "#ef4444",
    flexShrink: 0,
    marginTop: "2px",
  },
  errorText: {
    color: "#f87171",
    fontSize: "0.8rem",
    lineHeight: 1.4,
  },
};