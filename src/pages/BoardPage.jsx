import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function BoardPage() {
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Real-time listener — runs once on mount, cleans up on unmount
  useEffect(() => {
    const q = query(
      collection(db, "notices"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotices(data);
    });

    return unsubscribe; // stops listening when component unmounts
  }, []);

  async function handlePost() {
    if (!title.trim() || !body.trim()) {
      setError("Both title and body are required.");
      return;
    }
    setError("");
    setPosting(true);
    try {
      await addDoc(collection(db, "notices"), {
        title: title.trim(),
        body: body.trim(),
        author: user.email,
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setBody("");
    } catch (err) {
      setError(err.message);
    }
    setPosting(false);
  }

  async function handleDelete(noticeId) {
    try {
      await deleteDoc(doc(db, "notices", noticeId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    navigate("/login");
  }

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.heading}>Notice Board</h1>
        <div style={styles.headerRight}>
          <span style={styles.userEmail}>{user?.email}</span>
          <button style={styles.btnOutline} onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>

      {/* Post form */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Post a notice</h2>
        {error && <p style={styles.error}>{error}</p>}
        <input
          style={styles.input}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          style={{ ...styles.input, height: "80px", resize: "vertical" }}
          placeholder="Write your notice here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          style={posting ? styles.btnDisabled : styles.btnPrimary}
          onClick={handlePost}
          disabled={posting}
        >
          {posting ? "Posting…" : "Post notice"}
        </button>
      </div>

      {/* Notice feed */}
      <div style={styles.feed}>
        {notices.length === 0 && (
          <p style={styles.empty}>No notices yet. Be the first to post.</p>
        )}
        {notices.map((notice) => (
          <div key={notice.id} style={styles.noticeCard}>
            <div style={styles.noticeHeader}>
              <span style={styles.noticeTitle}>{notice.title}</span>
              {notice.uid === user?.uid && (
                <button
                  style={styles.btnDelete}
                  onClick={() => handleDelete(notice.id)}
                >
                  Delete
                </button>
              )}
            </div>
            <p style={styles.noticeBody}>{notice.body}</p>
            <div style={styles.noticeMeta}>
              <span>{notice.author}</span>
              <span>
                {notice.formattedDate
                  ? notice.formattedDate
                  : notice.createdAt?.toDate().toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: "680px", margin: "0 auto", padding: "1.5rem" },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "1.5rem",
  },
  heading: { fontSize: "22px", fontWeight: 600 },
  headerRight: { display: "flex", alignItems: "center", gap: "12px" },
  userEmail: { fontSize: "13px", color: "#71717a" },
  card: {
    background: "white", border: "1px solid #e4e4e7",
    borderRadius: "12px", padding: "1.25rem",
    display: "flex", flexDirection: "column", gap: "10px",
    marginBottom: "1.5rem",
  },
  sectionTitle: { fontSize: "15px", fontWeight: 500 },
  error: {
    background: "#fef2f2", color: "#b91c1c",
    border: "1px solid #fecaca", borderRadius: "8px",
    padding: "10px 12px", fontSize: "13px",
  },
  input: {
    width: "100%", padding: "10px 12px",
    border: "1px solid #d4d4d8", borderRadius: "8px",
    fontSize: "14px", fontFamily: "inherit", outline: "none",
  },
  btnPrimary: {
    padding: "10px 16px", border: "none", borderRadius: "8px",
    fontSize: "14px", fontWeight: 500,
    background: "#1d4ed8", color: "white", cursor: "pointer",
    alignSelf: "flex-start",
  },
  btnDisabled: {
    padding: "10px 16px", border: "none", borderRadius: "8px",
    fontSize: "14px", fontWeight: 500,
    background: "#93c5fd", color: "white", cursor: "not-allowed",
    alignSelf: "flex-start",
  },
  btnOutline: {
    padding: "6px 12px", borderRadius: "8px", fontSize: "13px",
    border: "1px solid #d4d4d8", background: "transparent",
    cursor: "pointer",
  },
  feed: { display: "flex", flexDirection: "column", gap: "12px" },
  empty: { color: "#71717a", fontSize: "14px", textAlign: "center", padding: "2rem 0" },
  noticeCard: {
    background: "white", border: "1px solid #e4e4e7",
    borderRadius: "12px", padding: "1rem 1.25rem",
  },
  noticeHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: "6px",
  },
  noticeTitle: { fontSize: "15px", fontWeight: 500 },
  noticeBody: { fontSize: "14px", color: "#3f3f46", lineHeight: 1.6, marginBottom: "10px" },
  noticeMeta: {
    display: "flex", justifyContent: "space-between",
    fontSize: "12px", color: "#a1a1aa",
  },
  btnDelete: {
    fontSize: "12px", color: "#b91c1c", background: "none",
    border: "none", cursor: "pointer", padding: "0",
  },
};