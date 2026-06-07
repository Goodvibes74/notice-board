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
        background: "var(--bg-base, #0B0B0B)",
        gap: "1.5rem",
      }}>
        <div style={{
          width: "28px",
          height: "28px",
          border: "2px solid var(--border, rgba(255,255,255,0.06))",
          borderRadius: "50%",
          borderTopColor: "var(--accent, #D4553A)",
          animation: "spin 0.7s linear infinite",
        }} />
        <span style={{
          fontFamily: "var(--font-display, Georgia)",
          fontStyle: "italic",
          fontSize: "1rem",
          color: "var(--text-muted, #5C5A56)",
          letterSpacing: "0.02em",
        }}>
          Verifying session…
        </span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  return children;
}