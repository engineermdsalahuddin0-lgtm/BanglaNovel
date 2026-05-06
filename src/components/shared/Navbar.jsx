import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, profile, signOut, isWriter, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropRef = useRef(null)

  // বাইরে click করলে dropdown বন্ধ হবে
  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    setDropdownOpen(false)
    await signOut()
    navigate('/auth')
  }

  return (
    <nav style={s.nav}>
      <Link to="/" style={s.logo}>📖 WebNovel BD</Link>

      <div style={s.links}>
        <Link to="/" style={s.link}>হোম</Link>
        <Link to="/novels" style={s.link}>সব বই</Link>

        {user ? (
          <div style={s.userArea} ref={dropRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={s.avatarBtn}
            >
              <div style={s.avatar}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} style={s.avatarImg} alt="" />
                  : <span>{profile?.username?.[0]?.toUpperCase() || 'U'}</span>
                }
              </div>
              <span style={s.username}>{profile?.username}</span>
              <svg style={{ ...s.chevron, transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {dropdownOpen && (
              <div style={s.dropdown}>
                {/* User info */}
                <div style={s.dropHeader}>
                  <div style={s.dropAvatar}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} style={s.avatarImg} alt="" />
                      : <span>{profile?.username?.[0]?.toUpperCase() || 'U'}</span>
                    }
                  </div>
                  <div>
                    <p style={s.dropName}>{profile?.username}</p>
                    <span style={
                      isAdmin ? s.roleAdmin :
                      isWriter ? s.roleWriter : s.roleReader
                    }>
                      {isAdmin ? '👑 Admin' : isWriter ? '✍️ Writer' : '📖 Reader'}
                    </span>
                  </div>
                </div>

                <div style={s.dropDivider} />

                {/* Common links */}
                <DropItem to="/profile" icon="👤" label="আমার প্রোফাইল" onClick={() => setDropdownOpen(false)} />
                <DropItem to="/subscribe" icon="🔑" label="সাবস্ক্রিপশন" onClick={() => setDropdownOpen(false)} />

                {/* Writer links */}
                {isWriter && (
                  <>
                    <div style={s.dropDivider} />
                    <p style={s.dropSectionLabel}>লেখক</p>
                    <DropItem to="/writer" icon="📝" label="লেখক ড্যাশবোর্ড" onClick={() => setDropdownOpen(false)} />
                    <DropItem to="/writer?tab=novels" icon="📚" label="আমার বই" onClick={() => setDropdownOpen(false)} />
                    <DropItem to="/writer?tab=earnings" icon="💰" label="আমার আয়" onClick={() => setDropdownOpen(false)} />
                  </>
                )}

                {/* Admin links */}
                {isAdmin && (
                  <>
                    <div style={s.dropDivider} />
                    <p style={s.dropSectionLabel}>অ্যাডমিন</p>
                    <DropItem to="/admin" icon="⚙️" label="অ্যাডমিন প্যানেল" onClick={() => setDropdownOpen(false)} />
                    <DropItem to="/admin?tab=users" icon="👥" label="ইউজার ম্যানেজ" onClick={() => setDropdownOpen(false)} />
                    <DropItem to="/admin?tab=subscriptions" icon="🔑" label="সাবস্ক্রিপশন" onClick={() => setDropdownOpen(false)} />
                  </>
                )}

                <div style={s.dropDivider} />

                {/* Logout */}
                <button onClick={handleSignOut} style={s.logoutItem}>
                  <span>🚪</span>
                  <span>লগআউট</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/auth" style={s.loginBtn}>লগইন</Link>
        )}
      </div>
    </nav>
  )
}

function DropItem({ to, icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} style={s.dropItem}>
      <span style={s.dropItemIcon}>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}

const s = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 1.5rem', height: 60, background: '#1a1a2e',
    position: 'sticky', top: 0, zIndex: 200, borderBottom: '1px solid #2a2a4a'
  },
  logo: { color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 },
  links: { display: 'flex', alignItems: 'center', gap: 4 },
  link: { color: '#ccc', textDecoration: 'none', fontSize: 14, padding: '6px 10px', borderRadius: 6 },
  loginBtn: { padding: '7px 16px', borderRadius: 6, background: '#e94560', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  userArea: { position: 'relative' },
  avatarBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'transparent', border: 'none', cursor: 'pointer',
    padding: '6px 10px', borderRadius: 8, color: '#fff'
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', background: '#e94560',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 14, overflow: 'hidden', flexShrink: 0
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  username: { fontSize: 13, color: '#fff', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chevron: { width: 14, height: 14, color: '#aaa', transition: 'transform .2s', flexShrink: 0 },

  // Dropdown
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    background: '#fff', borderRadius: 12, border: '1px solid #e8eaed',
    boxShadow: '0 8px 32px rgba(0,0,0,.12)', minWidth: 220, zIndex: 300,
    overflow: 'hidden'
  },
  dropHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' },
  dropAvatar: {
    width: 38, height: 38, borderRadius: '50%', background: '#e94560',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 15, overflow: 'hidden', flexShrink: 0
  },
  dropName: { fontSize: 14, fontWeight: 600, color: '#11181c', margin: '0 0 3px' },
  roleAdmin: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#fce4ec', color: '#c62828', fontWeight: 500 },
  roleWriter: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#ede7f6', color: '#4527a0', fontWeight: 500 },
  roleReader: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#e8f5e9', color: '#2e7d32', fontWeight: 500 },
  dropDivider: { height: 1, background: '#f1f3f4', margin: '4px 0' },
  dropSectionLabel: { fontSize: 11, fontWeight: 600, color: '#687076', textTransform: 'uppercase', letterSpacing: '.05em', padding: '6px 16px 2px', margin: 0 },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 16px', textDecoration: 'none', color: '#11181c',
    fontSize: 13, transition: 'background .1s'
  },
  dropItemIcon: { fontSize: 15, width: 20, textAlign: 'center' },
  logoutItem: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    padding: '9px 16px', background: 'none', border: 'none',
    cursor: 'pointer', color: '#e24b4a', fontSize: 13, textAlign: 'left'
  },
}
