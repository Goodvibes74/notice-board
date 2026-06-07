import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
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
  arrayRemove,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const ACCENTS = [
  { name: 'Terracotta', value: '#D4553A' },
  { name: 'Teal', value: '#2A9D8F' },
  { name: 'Gold', value: '#E9C46A' },
  { name: 'Sage', value: '#8FAE7E' },
  { name: 'Rose', value: '#C17B7B' },
  { name: 'Slate', value: '#64748B' },
];

const CATEGORY_COLORS = {
  general: '#64748B',
  announcement: '#E9C46A',
  sticky: '#D4553A',
  idea: '#2A9D8F',
  event: '#8FAE7E',
};

const AVATAR_COLORS = [
  '#D4553A', '#2A9D8F', '#E9C46A', '#8FAE7E', '#C17B7B',
  '#64748B', '#7C6F64', '#5B8C5A', '#B07D62', '#6B7280',
];

function getAvatarProps(email, displayName) {
  const name = displayName || email || '';
  let parts;
  if (name.includes('@')) {
    const left = name.split('@')[0];
    parts = left.split(/[._-]/);
  } else {
    parts = name.split(' ');
  }
  const initials = parts
    .filter(Boolean)
    .map((p) => p[0].toUpperCase())
    .slice(0, 2)
    .join('');
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  return { initials: initials || '?', color };
}

export default function BoardPage() {
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [accent, setAccent] = useState(ACCENTS[0].value);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'noir');

  /* ── Theme ── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'noir' ? 'warm' : 'noir'));
  }

  /* ── Toasts ── */
  function showToast(message, type = 'success') {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }

  /* ── Firestore Listener ── */
  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  /* ── Handlers ── */
  async function handlePost(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Both headline and message are required.');
      return;
    }
    setPosting(true);
    setError('');
    try {
      await addDoc(collection(db, 'notices'), {
        title: title.trim(),
        body: body.trim(),
        category,
        accent,
        author: user.email,
        authorName: user.displayName || user.email,
        uid: user.uid,
        likedBy: [],
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setBody('');
      setCategory('general');
      setAccent(ACCENTS[0].value);
      setIsComposerOpen(false);
      showToast('Notice published', 'success');
    } catch (err) {
      setError('Failed to post notice.');
      showToast('Failed to post notice', 'error');
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    try {
      await deleteDoc(doc(db, 'notices', id));
      setConfirmDeleteId(null);
      showToast('Notice deleted', 'success');
    } catch {
      showToast('Failed to delete notice', 'error');
    }
  }

  async function handleToggleLike(noticeId, likedBy) {
    const uid = user.uid;
    const isLiked = likedBy?.includes(uid);
    try {
      await updateDoc(doc(db, 'notices', noticeId), {
        likedBy: isLiked ? arrayRemove(uid) : arrayUnion(uid),
      });
    } catch {
      showToast('Could not update reaction', 'error');
    }
  }

  function handleSignOut() {
    signOut(auth).then(() => navigate('/login'));
  }

  /* ── Filter / Search / Sort ── */
  const filteredNotices = notices
    .filter((n) => categoryFilter === 'all' || n.category === categoryFilter)
    .filter((n) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (n.title || '').toLowerCase().includes(q) ||
        (n.body || '').toLowerCase().includes(q) ||
        (n.author || '').toLowerCase().includes(q) ||
        (n.authorName || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') {
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      }
      if (sortBy === 'popular') {
        return (b.likedBy?.length || 0) - (a.likedBy?.length || 0);
      }
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

  /* ── Computed Stats ── */
  const totalCount = notices.length;
  const totalReactions = notices.reduce((sum, n) => sum + (n.likedBy?.length || 0), 0);
  const stickyCount = notices.filter((n) => n.category === 'sticky').length;
  const ideaCount = notices.filter((n) => n.category === 'idea').length;

  /* ── Avatar for current user ── */
  const userAvatar = getAvatarProps(user?.email, user?.displayName);

  /* ── Format date ── */
  function formatDate(ts) {
    if (!ts?.seconds) return '';
    const d = new Date(ts.seconds * 1000);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const categories = ['general', 'announcement', 'sticky', 'idea', 'event'];

  /* ────────────────────────── RENDER ────────────────────────── */
  return (
    <div style={styles.page}>
      {/* ═══ HEADER BAR ═══ */}
      <header className="header-bar anim-slide-up" style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>
            <span style={{ color: 'var(--text-primary)' }}>Notice</span>
            <span style={{ color: 'var(--accent)' }}>Board</span>
          </span>
        </div>
        <div style={styles.headerRight}>
          <div
            id="header-avatar"
            style={{ ...styles.avatarCircle, backgroundColor: userAvatar.color, width: 34, height: 34, fontSize: '0.75rem' }}
          >
            {userAvatar.initials}
          </div>
          <span style={styles.userName}>{user?.displayName || user?.email}</span>
          <button
            id="btn-theme-toggle"
            className="btn-ghost"
            onClick={toggleTheme}
            style={{ padding: '6px 10px', minWidth: 0 }}
            title="Toggle theme"
          >
            {theme === 'noir' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
            )}
          </button>
          <button id="btn-logout" className="btn-ghost" onClick={handleSignOut} style={{ gap: 6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* ═══ TOOLBAR ═══ */}
      <section className="anim-slide-up delay-1" style={styles.toolbar}>
        {/* Search */}
        <div style={styles.searchWrap}>
          <svg style={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="input-search"
            className="ed-input-box"
            type="text"
            placeholder="Search bulletins…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 38, minWidth: 200 }}
          />
          {searchQuery && (
            <button
              id="btn-clear-search"
              onClick={() => setSearchQuery('')}
              style={styles.clearBtn}
              title="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div style={styles.pillRow}>
          {['all', ...categories].map((cat) => (
            <button
              key={cat}
              id={`filter-${cat}`}
              className={`filter-pill${categoryFilter === cat ? ' active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          id="select-sort"
          className="ed-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="popular">Popular</option>
        </select>

        {/* Compose */}
        <button
          id="btn-compose"
          className="btn-accent"
          onClick={() => setIsComposerOpen((o) => !o)}
          style={{ whiteSpace: 'nowrap' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Notice
        </button>
      </section>

      {/* ═══ COMPOSER ═══ */}
      {isComposerOpen && (
        <section className="ed-card anim-slide-down" style={styles.composer}>
          <h2 style={styles.composerTitle}>Compose Notice</h2>
          <div className="ed-rule" style={{ margin: '12px 0 20px' }}>new bulletin</div>

          <form onSubmit={handlePost}>
            {/* Title field */}
            <div style={styles.fieldGroup}>
              <label htmlFor="input-title" style={styles.fieldLabel}>HEADLINE</label>
              <input
                id="input-title"
                className="ed-input-box"
                type="text"
                placeholder="Enter a compelling headline…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
              />
              <span style={styles.charCount}>{title.length}/80</span>
            </div>

            {/* Body field */}
            <div style={styles.fieldGroup}>
              <label htmlFor="input-body" style={styles.fieldLabel}>MESSAGE</label>
              <textarea
                id="input-body"
                className="ed-input-box"
                placeholder="Write your bulletin content…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={800}
                style={{ height: 120, resize: 'none' }}
              />
              <span style={styles.charCount}>{body.length}/800</span>
            </div>

            {/* Category selector */}
            <div style={styles.fieldGroup}>
              <span style={styles.fieldLabel}>CATEGORY</span>
              <div style={styles.catRow}>
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    id={`cat-btn-${cat}`}
                    onClick={() => setCategory(cat)}
                    style={{
                      ...styles.catBtn,
                      borderColor: category === cat ? 'var(--accent)' : 'var(--border)',
                      background: category === cat ? 'var(--accent-muted)' : 'transparent',
                    }}
                  >
                    <span style={{ ...styles.catDot, backgroundColor: CATEGORY_COLORS[cat] }} />
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent picker */}
            <div style={styles.fieldGroup}>
              <span style={styles.fieldLabel}>ACCENT COLOR</span>
              <div style={styles.accentRow}>
                {ACCENTS.map((a) => (
                  <button
                    type="button"
                    key={a.value}
                    id={`accent-${a.name}`}
                    onClick={() => setAccent(a.value)}
                    title={a.name}
                    style={{
                      ...styles.accentCircle,
                      backgroundColor: a.value,
                      boxShadow:
                        accent === a.value
                          ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${a.value}, 0 0 12px ${a.value}55`
                          : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {error && <p style={styles.errorText}>{error}</p>}

            <button
              id="btn-submit-notice"
              type="submit"
              className="btn-accent"
              disabled={posting}
              style={{ width: '100%', marginTop: 8 }}
            >
              {posting ? <span className="spinner" /> : 'Publish Notice'}
            </button>
          </form>
        </section>
      )}

      {/* ═══ STATS ROW ═══ */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total', value: totalCount, color: 'var(--text-primary)', delay: 'delay-2' },
          { label: 'Reactions', value: totalReactions, color: 'var(--teal)', delay: 'delay-3' },
          { label: 'Stickies', value: stickyCount, color: 'var(--accent)', delay: 'delay-4' },
          { label: 'Ideas', value: ideaCount, color: 'var(--sage)', delay: 'delay-5' },
        ].map((stat) => (
          <div key={stat.label} className={`anim-slide-up ${stat.delay}`} style={styles.statItem}>
            <span style={{ ...styles.statNumber, color: stat.color }}>{stat.value}</span>
            <span style={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ═══ MASONRY FEED ═══ */}
      {filteredNotices.length === 0 ? (
        <div style={styles.emptyState} className="anim-fade">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
          </svg>
          <h3 style={styles.emptyTitle}>No bulletins found</h3>
          <p style={styles.emptySubtitle}>
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Be the first to post a notice.'}
          </p>
        </div>
      ) : (
        <div className="masonry-feed">
          {filteredNotices.map((notice, index) => {
            const liked = notice.likedBy?.includes(user?.uid);
            const isOwner = notice.uid === user?.uid;
            const avatar = getAvatarProps(notice.author, notice.authorName);
            return (
              <article
                key={notice.id}
                className="ed-card anim-slide-up"
                style={{ ...styles.card, animationDelay: `${index * 0.06}s` }}
              >
                {/* Accent stripe */}
                <div
                  style={{
                    height: 3,
                    background: notice.accent || CATEGORY_COLORS[notice.category] || 'var(--accent)',
                    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                  }}
                />

                <div style={styles.cardInner}>
                  {/* Card header */}
                  <div style={styles.cardHeader}>
                    <div style={styles.cardAuthorRow}>
                      <div
                        style={{
                          ...styles.avatarCircle,
                          backgroundColor: avatar.color,
                          width: 28,
                          height: 28,
                          fontSize: '0.6rem',
                        }}
                      >
                        {avatar.initials}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={styles.cardAuthorName}>{notice.authorName || notice.author}</span>
                        <span style={styles.cardDate}>{formatDate(notice.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`cat-badge cat-${notice.category}`}>{notice.category}</span>
                  </div>

                  {/* Title */}
                  <h3 style={styles.cardTitle}>{notice.title}</h3>

                  {/* Body */}
                  <p style={styles.cardBody}>{notice.body}</p>

                  {/* Footer */}
                  <div style={styles.cardFooter}>
                    <button
                      id={`btn-like-${notice.id}`}
                      onClick={() => handleToggleLike(notice.id, notice.likedBy)}
                      style={styles.likeBtn}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={liked ? '#DC2626' : 'none'}
                        stroke={liked ? '#DC2626' : 'var(--text-muted)'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: liked ? 'scale(1.2)' : 'scale(1)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span style={{ color: liked ? '#DC2626' : 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {notice.likedBy?.length || 0}
                      </span>
                    </button>

                    {isOwner && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {confirmDeleteId === notice.id ? (
                          <>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confirm?</span>
                            <button
                              id={`btn-confirm-del-${notice.id}`}
                              onClick={() => handleDelete(notice.id)}
                              style={{ ...styles.miniBtn, color: '#DC2626' }}
                            >
                              Yes
                            </button>
                            <button
                              id={`btn-cancel-del-${notice.id}`}
                              onClick={() => setConfirmDeleteId(null)}
                              style={styles.miniBtn}
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            id={`btn-delete-${notice.id}`}
                            onClick={() => handleDelete(notice.id)}
                            style={styles.deleteBtn}
                            title="Delete notice"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ═══ TOASTS ═══ */}
      {toasts.length > 0 && (
        <div className="toast-stack">
          {toasts.map((t) => (
            <div key={t.id} className={`toast-item ${t.type === 'error' ? 'toast-error' : 'toast-success'}`}>
              {t.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════ STYLES ════════════════════════════ */
const styles = {
  page: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '0 1.5rem 3rem',
  },

  /* Header */
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    background: 'var(--bg-elevated)',
    borderBottom: '1px solid var(--border)',
    padding: '16px 28px',
    margin: '0 -1.5rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    fontSize: '1.5rem',
    letterSpacing: '-0.01em',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  userName: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },

  /* Avatar */
  avatarCircle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    color: '#ffffff',
    fontWeight: 700,
    fontFamily: 'var(--font-body)',
    flexShrink: 0,
    letterSpacing: '0.02em',
  },

  /* Toolbar */
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    padding: '20px 0',
  },
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    pointerEvents: 'none',
  },
  clearBtn: {
    position: 'absolute',
    right: 8,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  },
  pillRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },

  /* Composer */
  composer: {
    padding: '2rem',
    marginBottom: 24,
  },
  composerTitle: {
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    fontSize: '1.5rem',
    color: 'var(--text-primary)',
  },
  fieldGroup: {
    marginBottom: 18,
    position: 'relative',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: 6,
  },
  charCount: {
    position: 'absolute',
    right: 0,
    top: 0,
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
  },
  catRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  catBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: '0.78rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textTransform: 'capitalize',
    transition: 'all 0.2s ease',
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  accentRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  accentCircle: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease',
    padding: 0,
  },
  errorText: {
    color: '#DC2626',
    fontSize: '0.82rem',
    marginBottom: 8,
  },

  /* Stats */
  statsRow: {
    display: 'flex',
    gap: 24,
    padding: '8px 0 20px',
    flexWrap: 'wrap',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.3rem',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },

  /* Cards */
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  cardInner: {
    padding: '16px 20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardAuthorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  cardAuthorName: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  cardDate: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    fontSize: '1.15rem',
    margin: '8px 0 4px',
    color: 'var(--text-primary)',
    lineHeight: 1.3,
  },
  cardBody: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid var(--border)',
    paddingTop: 10,
    marginTop: 12,
  },
  likeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 'var(--radius)',
    transition: 'background 0.15s ease',
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    padding: '4px 6px',
    borderRadius: 'var(--radius)',
    transition: 'color 0.15s ease',
  },
  miniBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '3px 10px',
    color: 'var(--text-secondary)',
    transition: 'all 0.15s ease',
  },

  /* Empty */
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    fontSize: '1.3rem',
    color: 'var(--text-primary)',
  },
  emptySubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
};