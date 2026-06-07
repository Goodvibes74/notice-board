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
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "noir" || saved === "warm" ? "dark" : (saved || "dark");
  });
  const navigate = useNavigate();

  // Sync theme to document and localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Clear error when switching modes
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

  function toggleTheme() {
    const themes = ["dark", "light", "cyberpunk"];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }

  return (
    <div className="login-split" style={styles.container}>
      {/* Background Animated Blobs */}
      <div className="glow-blob blob-1"></div>
      <div className="glow-blob blob-2"></div>
      <div className="glow-mesh"></div>

      {/* ─── LEFT SIDE: Brand Hero ─── */}
      <div className="login-brand anim-slide-up" style={styles.brandPanel}>
        {/* Radial gradient overlay */}
        <div style={styles.brandOverlay} />

        <div style={styles.brandContent}>
          <h1 style={styles.brandTitle}>
            <span style={styles.brandLine}>Notice</span>
            <span style={styles.brandLine}>Board</span>
          </h1>

          {/* Decorative line */}
          <div style={styles.brandDivider} />

          <p style={styles.brandTagline}>
            Real-time collaborative bulletins for modern teams
          </p>
        </div>

        {/* Bottom decorative diamonds */}
        <div style={styles.brandFooter}>
          <span style={styles.diamondLine} />
          <span style={styles.diamond}>◆</span>
          <span style={styles.diamondLineShort} />
          <span style={styles.diamond}>◆</span>
          <span style={styles.diamondLineShort} />
          <span style={styles.diamond}>◆</span>
          <span style={styles.diamondLine} />
        </div>
      </div>

      {/* ─── RIGHT SIDE: Auth Form ─── */}
      <div style={styles.formPanel}>
        {/* Theme toggle */}
        <button
          id="theme-toggle-btn"
          className="btn-ghost"
          onClick={toggleTheme}
          style={{ ...styles.themeToggle, display: "flex", alignItems: "center", gap: "6px" }}
          title={`Active Theme: ${theme}. Click to switch.`}
        >
          {theme === "light" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : theme === "cyberpunk" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          <span style={{ textTransform: "capitalize", fontSize: "0.8rem", fontWeight: 600 }}>{theme}</span>
        </button>

        <div className="anim-slide-up delay-2" style={styles.formContent}>
          {/* Section header */}
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>
              {isRegister ? "Create account" : "Welcome back"}
            </h2>
            <p style={styles.formSubtitle}>
              {isRegister
                ? "Join your team and start collaborating"
                : "Sign in to access your bulletins"}
            </p>
          </div>

          {/* Decorative rule */}
          <div className="ed-rule" style={styles.ruleSpacing}>
            or continue below
          </div>

          {/* Error display */}
          {error && (
            <div className="anim-fade" style={styles.errorBar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {/* Auth form */}
          <form id="auth-form" onSubmit={handleSubmit} style={styles.form}>
            {/* Username (register only) */}
            {isRegister && (
              <div className="anim-fade" style={styles.fieldGroup}>
                <label htmlFor="input-username" style={styles.fieldLabel}>
                  Display Name
                </label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="input-username"
                    className="ed-input"
                    type="text"
                    placeholder="Your display name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={isRegister}
                    style={styles.inputPadded}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div style={styles.fieldGroup}>
              <label htmlFor="input-email" style={styles.fieldLabel}>
                Email
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="input-email"
                  className="ed-input"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.inputPadded}
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label htmlFor="input-password" style={styles.fieldLabel}>
                Password
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="input-password"
                  className="ed-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={styles.inputPaddedPassword}
                />
                <button
                  id="password-visibility-toggle"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeToggle}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              id="auth-submit-btn"
              type="submit"
              className="btn-accent"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  <span>{isRegister ? "Create Account" : "Sign In"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Mode switcher */}
          <p id="auth-mode-switch" style={styles.switchText}>
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <button
              id="auth-mode-toggle"
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              style={styles.switchLink}
            >
              {isRegister ? "Sign in" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ─── */
const styles = {
  /* Container — split-screen grid */
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 0.8fr",
    minHeight: "100vh",
  },

  /* ─── Brand Panel (Left) ─── */
  brandPanel: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "4rem 3rem",
    minHeight: "100vh",
    background: "var(--bg-base)",
    overflow: "hidden",
  },
  brandOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  brandContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  brandTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(4rem, 8vw, 7rem)",
    fontWeight: 400,
    fontStyle: "italic",
    color: "var(--text-primary)",
    lineHeight: 0.95,
    letterSpacing: "-0.02em",
    margin: 0,
  },
  brandLine: {
    display: "block",
  },
  brandDivider: {
    width: 60,
    height: 1,
    background: "var(--border)",
    marginTop: "2rem",
    marginBottom: "1.2rem",
  },
  brandTagline: {
    fontFamily: "var(--font-body)",
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    fontStyle: "italic",
    lineHeight: 1.6,
    maxWidth: 320,
    margin: 0,
  },

  /* Bottom decorative diamonds */
  brandFooter: {
    position: "absolute",
    bottom: "2.5rem",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 0,
  },
  diamond: {
    color: "var(--text-muted)",
    fontSize: "0.45rem",
    lineHeight: 1,
    padding: "0 8px",
  },
  diamondLine: {
    display: "inline-block",
    width: 40,
    height: 1,
    background: "var(--border)",
  },
  diamondLineShort: {
    display: "inline-block",
    width: 20,
    height: 1,
    background: "var(--border)",
  },

  /* ─── Form Panel (Right) ─── */
  formPanel: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "3rem",
    background: "var(--bg-elevated)",
    overflow: "auto",
  },
  themeToggle: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
    padding: "8px 12px",
  },
  formContent: {
    width: "100%",
    maxWidth: 380,
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },

  /* Section header */
  formHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  formTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "1.8rem",
    fontWeight: 400,
    fontStyle: "italic",
    color: "var(--text-primary)",
    margin: 0,
    letterSpacing: "-0.01em",
  },
  formSubtitle: {
    fontFamily: "var(--font-body)",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    margin: 0,
    lineHeight: 1.5,
  },

  /* Decorative rule spacing */
  ruleSpacing: {
    margin: "4px 0",
  },

  /* Error bar */
  errorBar: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "10px 14px",
    borderLeft: "3px solid #DC2626",
    background: "rgba(220, 38, 38, 0.06)",
    borderRadius: "0 var(--radius) var(--radius) 0",
  },
  errorText: {
    fontFamily: "var(--font-body)",
    fontSize: "0.8rem",
    color: "#f87171",
    lineHeight: 1.4,
  },

  /* Form */
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  /* Field group (label + input) */
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  fieldLabel: {
    fontFamily: "var(--font-body)",
    fontSize: "0.65rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--text-muted)",
  },

  /* Input wrapper */
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  inputIcon: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    pointerEvents: "none",
  },
  inputPadded: {
    paddingLeft: 28,
  },
  inputPaddedPassword: {
    paddingLeft: 28,
    paddingRight: 36,
  },

  /* Eye toggle */
  eyeToggle: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 4,
  },

  /* Submit */
  submitBtn: {
    width: "100%",
    marginTop: 4,
  },

  /* Mode switch text */
  switchText: {
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
    color: "var(--text-secondary)",
    textAlign: "center",
    margin: 0,
  },
  switchLink: {
    background: "none",
    border: "none",
    color: "var(--accent)",
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    textDecoration: "none",
  },
};