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
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Accent presets
const ACCENTS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Violet", value: "#8b5cf6" }
];

export default function BoardPage() {
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [accent, setAccent] = useState("#6366f1");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  
  // Search, Filter, and Sorting states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Inline delete safety states
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Custom Toast System state
  const [toasts, setToasts] = useState([]);

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Sync theme to document element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Real-time listener for Firestore notices
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

    return unsubscribe;
  }, []);

  function showToast(message, type = "success") {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }

  // Auto-set accent based on category picker (optional user override)
  function handleCategoryChange(cat) {
    setCategory(cat);
    const catAccents = {
      general: "#6366f1", // Indigo
      announcement: "#f59e0b", // Amber
      sticky: "#ef4444", // Red
      idea: "#10b981", // Teal
      event: "#8b5cf6" // Purple
    };
    if (catAccents[cat]) {
      setAccent(catAccents[cat]);
    }
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast("Both title and body are required.", "error");
      return;
    }
    if (title.length > 80) {
      showToast("Title is too long (max 80 characters).", "error");
      return;
    }
    if (body.length > 800) {
      showToast("Notice body is too long (max 800 characters).", "error");
      return;
    }

    setPosting(true);
    try {
      await addDoc(collection(db, "notices"), {
        title: title.trim(),
        body: body.trim(),
        category: category,
        accent: accent,
        author: user.email,
        authorName: user.displayName || user.email,
        uid: user.uid,
        likedBy: [],
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setBody("");
      setIsComposerOpen(false);
      showToast("Notice posted successfully!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(noticeId) {
    try {
      await deleteDoc(doc(db, "notices", noticeId));
      showToast("Notice deleted.", "success");
      setConfirmDeleteId(null);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleToggleLike(noticeId, isLiked) {
    const noticeRef = doc(db, "notices", noticeId);
    try {
      if (isLiked) {
        await updateDoc(noticeRef, {
          likedBy: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(noticeRef, {
          likedBy: arrayUnion(user.uid)
        });
      }
    } catch (err) {
      showToast("Could not record reaction.", "error");
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    showToast("Signed out successfully");
    navigate("/login");
  }

  function toggleTheme() {
    const themes = ["dark", "light", "cyberpunk"];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }

  // Generate User Avatar parameters
  function getAvatarProps(email, displayName) {
    const name = displayName || email || "?";
    if (!name) return { initials: "?", color: "#6b7280" };
    
    let initials = "";
    if (name.includes("@")) {
      const parts = name.split("@")[0].split(/[._-]/);
      initials = parts.map(p => p[0]?.toUpperCase()).slice(0, 2).join("");
    } else {
      const parts = name.split(" ");
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        initials = name.slice(0, 2).toUpperCase();
      }
    }
    
    const colors = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#ec4899"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    return { initials, color };
  }

  const currentUserAvatar = getAvatarProps(user?.email, user?.displayName);

  // Statistics Calculation
  const stats = {
    total: notices.length,
    likes: notices.reduce((acc, n) => acc + (n.likedBy?.length || 0), 0),
    stickies: notices.filter(n => n.category === "sticky").length,
    ideas: notices.filter(n => n.category === "idea").length,
  };

  // Filter & Search & Sort Notice List
  const filteredNotices = notices
    .filter((n) => {
      // Category Filter
      if (categoryFilter !== "all" && n.category !== categoryFilter) return false;
      // Search query
      const queryStr = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(queryStr) ||
        n.body.toLowerCase().includes(queryStr) ||
        (n.author && n.author.toLowerCase().includes(queryStr)) ||
        (n.authorName && n.authorName.toLowerCase().includes(queryStr))
      );
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return tA - tB;
      }
      if (sortBy === "popular") {
        const likesA = a.likedBy?.length || 0;
        const likesB = b.likedBy?.length || 0;
        return likesB - likesA;
      }
      // default: newest
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return tB - tA;
    });

  return (
    <div style={styles.page}>
      {/* Background blobbys */}
      <div className="glow-blob blob-1"></div>
      <div className="glow-blob blob-2"></div>
      <div className="glow-mesh"></div>

      {/* Toast popup alerts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type === "error" ? "toast-error" : toast.type === "success" ? "toast-success" : ""}`}>
            {toast.type === "error" ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header Container */}
      <header className="glass-panel" style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logoCircle}>
            <svg style={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </div>
          <div style={styles.titleCol}>
            <h1 style={styles.heading}>NoticeBoard</h1>
            <span style={styles.subheading}>Workspace Bulletin</span>
          </div>
        </div>

        <div style={styles.headerRight}>
          {/* User details */}
          <div style={styles.userInfo}>
            <div style={{ ...styles.avatar, background: currentUserAvatar.color }}>
              {currentUserAvatar.initials}
            </div>
            <div style={styles.userMeta}>
              <span style={styles.userEmail}>{user?.displayName || user?.email}</span>
              <span style={styles.userRole}>{user?.displayName ? user?.email : "Contributor"}</span>
            </div>
          </div>

          <div style={styles.actionBtnRow}>
            {/* Theme switcher */}
            <button 
              onClick={toggleTheme}
              className="btn-secondary" 
              style={styles.themeBtn}
              title={`Switch theme: Current is ${theme}`}
              id="header-theme-toggle"
            >
              {theme === "light" ? (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
              ) : theme === "cyberpunk" ? (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M13 12a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              )}
            </button>

            {/* Logout */}
            <button className="btn-modern btn-outline" style={styles.logoutBtn} onClick={handleSignOut} id="header-signout-btn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main style={styles.mainContent}>
        
        {/* Left column (Stats, Form composer) */}
        <div style={styles.leftCol}>
          {/* Dashboard Stats */}
          <div className="stats-grid animate-fade-in">
            <div className="stat-card" style={styles.statCardExt}>
              <div className="stat-val">{stats.total}</div>
              <div className="stat-label">Total Board</div>
            </div>
            <div className="stat-card" style={styles.statCardExt}>
              <div className="stat-val" style={{ color: "var(--secondary-accent)" }}>{stats.likes}</div>
              <div className="stat-label">Reactions</div>
            </div>
            <div className="stat-card" style={styles.statCardExt}>
              <div className="stat-val" style={{ color: "#ef4444" }}>{stats.stickies}</div>
              <div className="stat-label">Stickies</div>
            </div>
            <div className="stat-card" style={styles.statCardExt}>
              <div className="stat-val" style={{ color: "#10b981" }}>{stats.ideas}</div>
              <div className="stat-label">Ideas</div>
            </div>
          </div>

          {/* Collapsible composer button */}
          <button
            onClick={() => setIsComposerOpen(!isComposerOpen)}
            className="btn-modern btn-primary"
            style={styles.composerToggle}
            id="composer-toggle-btn"
          >
            {isComposerOpen ? (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span>Close Composer</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Create New Notice</span>
              </>
            )}
          </button>

          {/* Form Card (Collapsible) */}
          {isComposerOpen && (
            <div className="glass-panel animate-fade-in" style={styles.formCard}>
              <h2 style={styles.formCardTitle}>Post a bulletin notice</h2>
              <form onSubmit={handlePost} style={styles.formContainer}>
                
                {/* Title */}
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Notice Title</label>
                  <input
                    className="modern-input"
                    placeholder="E.g., Design review this afternoon"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={80}
                    required
                    id="composer-input-title"
                  />
                  <div style={styles.charCounter}>{title.length}/80</div>
                </div>

                {/* Content */}
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Message Board</label>
                  <textarea
                    className="modern-input"
                    style={styles.textarea}
                    placeholder="Enter details, links, or quick updates here..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={800}
                    required
                    id="composer-input-body"
                  />
                  <div style={styles.charCounter}>{body.length}/800</div>
                </div>

                {/* Category Selection */}
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Category Type</label>
                  <div style={styles.categoryPicker}>
                    {["general", "announcement", "sticky", "idea", "event"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryChange(cat)}
                        style={{
                          ...styles.categoryBtn,
                          borderColor: category === cat ? "var(--primary-accent)" : "var(--border-color)",
                          background: category === cat ? "rgba(var(--primary-accent-rgb), 0.15)" : "transparent",
                          color: category === cat ? "var(--text-primary)" : "var(--text-secondary)"
                        }}
                        id={`category-picker-btn-${cat}`}
                      >
                        <span style={styles.categoryBtnDot(cat)}></span>
                        <span style={{ textTransform: "capitalize", fontSize: "0.75rem" }}>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color Override */}
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Card Board Accent Color</label>
                  <div style={styles.accentPicker}>
                    {ACCENTS.map((acc) => (
                      <button
                        key={acc.value}
                        type="button"
                        onClick={() => setAccent(acc.value)}
                        style={{
                          ...styles.accentBubble,
                          backgroundColor: acc.value,
                          transform: accent === acc.value ? "scale(1.2)" : "scale(1.0)",
                          border: accent === acc.value ? "2px solid #ffffff" : "2px solid transparent",
                          boxShadow: accent === acc.value ? "0 0 8px " + acc.value : "none"
                        }}
                        title={acc.name}
                        id={`accent-picker-btn-${acc.name.toLowerCase()}`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-modern btn-primary"
                  style={styles.submitBtn}
                  disabled={posting}
                  id="composer-submit-btn"
                >
                  {posting ? (
                    <div className="spinner"></div>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 2 15 22 11 13 2 9 22 2"/><line x1="22" y1="2" x2="11" y2="13"/></svg>
                      <span>Post to Board</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right column (Feed filters and Cards feed) */}
        <div style={styles.rightCol}>
          
          {/* Feed Filter Panel */}
          <div className="glass-panel" style={styles.filterBar}>
            {/* Search Input */}
            <div style={styles.searchContainer}>
              <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                className="modern-input"
                style={styles.searchInput}
                placeholder="Search notices or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="search-input"
              />
              {searchQuery && (
                <button 
                  style={styles.clearSearchBtn} 
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                  id="clear-search-btn"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div style={styles.filterTabsRow}>
              <div style={styles.filterPills}>
                {["all", "general", "announcement", "sticky", "idea", "event"].map((pill) => (
                  <button
                    key={pill}
                    onClick={() => setCategoryFilter(pill)}
                    style={{
                      ...styles.pillBtn,
                      background: categoryFilter === pill ? "var(--primary-accent)" : "rgba(255, 255, 255, 0.05)",
                      color: categoryFilter === pill ? "#ffffff" : "var(--text-secondary)",
                      border: "1px solid " + (categoryFilter === pill ? "var(--primary-accent)" : "var(--border-color)")
                    }}
                    id={`filter-pill-${pill}`}
                  >
                    <span style={{ textTransform: "capitalize" }}>{pill}</span>
                  </button>
                ))}
              </div>

              {/* Sorting Select */}
              <div style={styles.sortCol}>
                <select
                  className="modern-input"
                  style={styles.sortSelect}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  id="sort-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Popular (Most Likes)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notice Cards Feed */}
          <div style={styles.feed}>
            {filteredNotices.length === 0 ? (
              <div className="glass-panel" style={styles.emptyContainer}>
                <svg style={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/></svg>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "4px" }}>No bulletin postings</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                  {searchQuery || categoryFilter !== "all" 
                    ? "No matches found. Try clearing your filters or search query." 
                    : "No notices posted. Start the conversation by sharing a notice."}
                </p>
              </div>
            ) : (
              filteredNotices.map((notice) => {
                const authorAvatar = getAvatarProps(notice.author, notice.authorName);
                const isLiked = notice.likedBy?.includes(user?.uid);
                const isOwner = notice.uid === user?.uid;

                return (
                  <article
                    key={notice.id}
                    className="glass-panel animate-fade-in"
                    style={{
                      ...styles.noticeCard,
                      borderLeft: "6px solid " + (notice.accent || "#6366f1")
                    }}
                  >
                    {/* Card Top Row / Info */}
                    <div style={styles.cardHeader}>
                      <div style={styles.cardAuthor}>
                        <div style={{ ...styles.cardAvatar, background: authorAvatar.color }}>
                          {authorAvatar.initials}
                        </div>
                        <div style={styles.cardAuthorMeta}>
                          <span style={styles.authorEmail} title={notice.authorName || notice.author}>
                            {notice.authorName || notice.author?.split("@")[0]}
                          </span>
                          <span style={styles.cardDate}>
                            {notice.createdAt?.toDate 
                              ? notice.createdAt.toDate().toLocaleDateString("en-US", {
                                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                })
                              : "Recent"}
                          </span>
                        </div>
                      </div>

                      {/* Category Badge & Delete */}
                      <div style={styles.cardTopRight}>
                        <span className={`badge badge-${notice.category || "general"}`}>
                          {notice.category || "general"}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={styles.cardContent}>
                      <h3 style={styles.cardTitle}>{notice.title}</h3>
                      <p style={styles.cardBody}>{notice.body}</p>
                    </div>

                    {/* Card Footer Actions (Likes & Deletion) */}
                    <div style={styles.cardFooter}>
                      {/* Like Trigger */}
                      <button
                        onClick={() => handleToggleLike(notice.id, isLiked)}
                        style={styles.likeBtn}
                        title={isLiked ? "Unlike notice" : "Like notice"}
                        id={`like-btn-${notice.id}`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill={isLiked ? "#f43f5e" : "none"}
                          stroke={isLiked ? "#f43f5e" : "var(--text-tertiary)"}
                          strokeWidth="2"
                          style={{
                            ...styles.likeIcon,
                            transform: isLiked ? "scale(1.15)" : "scale(1)"
                          }}
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span style={{ 
                          fontSize: "0.8rem", 
                          color: isLiked ? "var(--text-primary)" : "var(--text-tertiary)",
                          fontWeight: isLiked ? 600 : 500
                        }}>
                          {notice.likedBy?.length || 0}
                        </span>
                      </button>

                      {/* Deletion safety flow */}
                      {isOwner && (
                        <div style={styles.deleteZone}>
                          {confirmDeleteId === notice.id ? (
                            <div style={styles.confirmDeleteWrapper}>
                              <span style={styles.confirmDeleteLabel}>Confirm?</span>
                              <button 
                                className="btn-modern btn-primary"
                                style={styles.deleteConfirmBtn} 
                                onClick={() => handleDelete(notice.id)}
                                id={`confirm-delete-btn-${notice.id}`}
                              >
                                Yes
                              </button>
                              <button 
                                className="btn-modern btn-secondary"
                                style={styles.deleteCancelBtn} 
                                onClick={() => setConfirmDeleteId(null)}
                                id={`cancel-delete-btn-${notice.id}`}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn-danger-text"
                              onClick={() => setConfirmDeleteId(notice.id)}
                              title="Delete this notice"
                              id={`delete-btn-${notice.id}`}
                            >
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    position: "relative"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
    padding: "1rem 1.5rem",
    borderWidth: "1px"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "rgba(var(--primary-accent-rgb), 0.15)",
    border: "1px solid rgba(var(--primary-accent-rgb), 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--primary-accent)"
  },
  logoIcon: {
    width: "20px",
    height: "20px",
  },
  titleCol: {
    display: "flex",
    flexDirection: "column",
  },
  heading: {
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    lineHeight: 1.1
  },
  subheading: {
    fontSize: "0.75rem",
    color: "var(--text-tertiary)"
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap"
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.9rem",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
  },
  userMeta: {
    display: "flex",
    flexDirection: "column",
  },
  userEmail: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-primary)"
  },
  userRole: {
    fontSize: "0.7rem",
    color: "var(--text-tertiary)"
  },
  actionBtnRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  themeBtn: {
    padding: "9px 11px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  logoutBtn: {
    padding: "8px 14px",
    fontSize: "0.8rem",
    borderRadius: "8px",
  },
  mainContent: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: "1.5rem",
    alignItems: "start",
    // Responsive grid handling
    "@media (max-width: 820px)": {
      gridTemplateColumns: "1fr"
    }
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    position: "sticky",
    top: "20px"
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  statCardExt: {
    padding: "16px 10px",
  },
  composerToggle: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "0.9rem"
  },
  formCard: {
    padding: "1.5rem",
    borderWidth: "1px"
  },
  formCardTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: "15px"
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    position: "relative"
  },
  fieldLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    color: "var(--text-secondary)"
  },
  textarea: {
    height: "100px",
    resize: "none"
  },
  charCounter: {
    alignSelf: "flex-end",
    fontSize: "0.65rem",
    color: "var(--text-tertiary)",
    marginTop: "2px"
  },
  categoryPicker: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px"
  },
  categoryBtn: {
    flex: "1 1 calc(50% - 6px)",
    padding: "6px 8px",
    borderRadius: "6px",
    borderWidth: "1px",
    borderStyle: "solid",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s"
  },
  categoryBtnDot: (cat) => {
    const colorMap = {
      general: "#6366f1",
      announcement: "#f59e0b",
      sticky: "#ef4444",
      idea: "#10b981",
      event: "#8b5cf6"
    };
    return {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      backgroundColor: colorMap[cat] || "#6366f1",
      display: "inline-block"
    };
  },
  accentPicker: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    padding: "4px 0"
  },
  accentBubble: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  submitBtn: {
    width: "100%",
    marginTop: "6px"
  },
  filterBar: {
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    borderWidth: "1px"
  },
  searchContainer: {
    position: "relative",
    width: "100%"
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "16px",
    height: "16px",
    color: "var(--text-tertiary)",
    pointerEvents: "none"
  },
  searchInput: {
    paddingLeft: "42px",
    paddingRight: "38px"
  },
  clearSearchBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "var(--text-tertiary)",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center"
  },
  filterTabsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap"
  },
  filterPills: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap"
  },
  pillBtn: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s"
  },
  sortCol: {
    minWidth: "140px"
  },
  sortSelect: {
    padding: "6px 10px",
    fontSize: "0.75rem"
  },
  feed: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  emptyContainer: {
    padding: "3rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-secondary)"
  },
  emptyIcon: {
    width: "48px",
    height: "48px",
    color: "var(--text-tertiary)",
    marginBottom: "15px"
  },
  noticeCard: {
    padding: "1.25rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    borderWidth: "1px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px"
  },
  cardAuthor: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  cardAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.75rem"
  },
  cardAuthorMeta: {
    display: "flex",
    flexDirection: "column",
  },
  authorEmail: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    maxWidth: "120px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  cardDate: {
    fontSize: "0.65rem",
    color: "var(--text-tertiary)"
  },
  cardTopRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "var(--text-primary)"
  },
  cardBody: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    wordBreak: "break-word",
    whiteSpace: "pre-wrap"
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "4px",
    paddingTop: "10px",
    borderTop: "1px solid var(--border-color)"
  },
  likeBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    outline: "none"
  },
  likeIcon: {
    transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  },
  deleteZone: {
    display: "flex",
    alignItems: "center"
  },
  confirmDeleteWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(239, 68, 68, 0.08)",
    padding: "3px 8px",
    borderRadius: "6px",
    border: "1px solid rgba(239, 68, 68, 0.2)"
  },
  confirmDeleteLabel: {
    fontSize: "0.7rem",
    color: "#f87171",
    fontWeight: 600
  },
  deleteConfirmBtn: {
    padding: "2px 8px",
    fontSize: "0.7rem",
    borderRadius: "4px",
    background: "#ef4444"
  },
  deleteCancelBtn: {
    padding: "2px 8px",
    fontSize: "0.7rem",
    borderRadius: "4px"
  }
};