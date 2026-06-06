import { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin() {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/board");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRegister() {
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/board");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Notice Board</h1>
        <p style={styles.subtitle}>Sign in or create an account</p>

        {error && <p style={styles.error}>{error}</p>}

        <input
          style={styles.input}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <div style={styles.btnRow}>
          <button style={styles.btnPrimary} onClick={handleLogin}>Sign in</button>
          <button style={styles.btnSecondary} onClick={handleRegister}>Register</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f4f5",
  },
  card: {
    background: "white",
    border: "1px solid #e4e4e7",
    borderRadius: "12px",
    padding: "2rem",
    width: "100%",
    maxWidth: "380px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  title: { fontSize: "22px", fontWeight: 600 },
  subtitle: { fontSize: "14px", color: "#71717a", marginTop: "-6px" },
  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "13px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d4d4d8",
    borderRadius: "8px",
    fontSize: "15px",
    outline: "none",
  },
  btnRow: { display: "flex", gap: "8px" },
  btnPrimary: {
    flex: 1, padding: "10px", border: "none",
    borderRadius: "8px", fontSize: "14px", fontWeight: 500,
    background: "#1d4ed8", color: "white", cursor: "pointer",
  },
  btnSecondary: {
    flex: 1, padding: "10px",
    border: "1px solid #d4d4d8",
    borderRadius: "8px", fontSize: "14px", fontWeight: 500,
    background: "#f4f4f5", color: "#111", cursor: "pointer",
  },
};