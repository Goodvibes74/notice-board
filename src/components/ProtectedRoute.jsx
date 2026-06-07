import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  if (user === undefined) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary, #0a0f1d)",
        color: "var(--text-primary, #f8fafc)",
        fontFamily: "var(--font-body, system-ui)",
        gap: "1rem"
      }}>
        <div className="spinner" style={{ width: "32px", height: "32px", borderTopColor: "var(--primary-accent, #6366f1)" }}></div>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary, #94a3b8)", letterSpacing: "0.05em" }}>Verifying Session...</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  return children;
}