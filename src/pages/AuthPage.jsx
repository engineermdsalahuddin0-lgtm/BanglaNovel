import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('reader')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else navigate('/')
    } else {
      if (!username.trim()) { setError('Username দাও'); setLoading(false); return }
      const { error } = await signUp(email, password, username, role)
      if (error) setError(error.message)
      else navigate('/')
    }
    setLoading(false)
  }

  return (
    <div style={s.wrap}>
      {/* Cinematic background with layered gradients */}
      <div style={s.bgOverlay} />
      <div style={s.bgNoise} />

      {/* Top navbar like Netflix */}
      <nav style={s.nav}>
        <div style={s.navLogo}>
          <span style={s.navLogoIcon}>📖</span>
          <span style={s.navLogoText}>WebNovel BD</span>
        </div>
      </nav>

      {/* Main content */}
      <div style={s.content}>
        <div style={s.card}>
          <h1 style={s.heading}>
            {mode === 'login' ? 'সাইন ইন করো' : 'যোগ দাও'}
          </h1>

          <form onSubmit={handleSubmit} style={s.form}>
            {mode === 'signup' && (
              <div style={s.fieldWrap}>
                <input
                  style={s.input}
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={s.fieldWrap}>
              <input
                style={s.input}
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={s.fieldWrap}>
              <input
                style={s.input}
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Role selection — signup only */}
            {mode === 'signup' && (
              <div style={s.roleSection}>
                <p style={s.roleLabel}>আমি একজন...</p>
                <div style={s.roleGrid}>
                  <button
                    type="button"
                    onClick={() => setRole('reader')}
                    style={role === 'reader' ? s.roleCardActive : s.roleCard}
                  >
                    <span style={s.roleIcon}>📖</span>
                    <strong style={s.roleName}>পাঠক</strong>
                    <span style={s.roleDesc}>বই পড়তে চাই</span>
                    {role === 'reader' && <div style={s.roleCheck}>✓</div>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('writer')}
                    style={role === 'writer' ? s.roleCardActive : s.roleCard}
                  >
                    <span style={s.roleIcon}>✍️</span>
                    <strong style={s.roleName}>লেখক</strong>
                    <span style={s.roleDesc}>বই লিখতে চাই</span>
                    {role === 'writer' && <div style={s.roleCheck}>✓</div>}
                  </button>
                </div>
              </div>
            )}

            {error && <p style={s.error}>{error}</p>}

            <button style={s.submitBtn} type="submit" disabled={loading}>
              {loading ? 'অপেক্ষা করো...' : mode === 'login' ? 'সাইন ইন' : 'একাউন্ট খোলো'}
            </button>
          </form>

          {/* Toggle mode */}
          <p style={s.toggleText}>
            {mode === 'login' ? 'নতুন WebNovel BD-তে?' : 'আগে থেকে একাউন্ট আছে?'}{' '}
            <button
              style={s.toggleBtn}
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            >
              {mode === 'login' ? 'এখনই যোগ দাও' : 'সাইন ইন করো'}
            </button>
          </p>

          {mode === 'signup' && (
            <p style={s.note}>
              একাউন্ট খুললে আমাদের{' '}
              <a href="#" style={s.noteLink}>Terms of Service</a> এবং{' '}
              <a href="#" style={s.noteLink}>Privacy Policy</a> মেনে নিচ্ছ।
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: {
    minHeight: '100vh',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    background: '#141414',
    fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', sans-serif",
  },

  /* Dark cinematic overlay — simulates Netflix hero bg */
  bgOverlay: {
    position: 'fixed',
    inset: 0,
    background: `
      radial-gradient(ellipse at 20% 50%, rgba(180, 30, 30, 0.15) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(180, 30, 30, 0.10) 0%, transparent 50%),
      linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(20,20,20,0.85) 40%, #141414 100%)
    `,
    zIndex: 0,
  },

  bgNoise: {
    position: 'fixed',
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
    backgroundSize: '200px',
    zIndex: 0,
    opacity: 0.5,
    pointerEvents: 'none',
  },

  /* Netflix-style top nav */
  nav: {
    position: 'relative',
    zIndex: 10,
    padding: '18px 48px',
    display: 'flex',
    alignItems: 'center',
  },
  navLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  navLogoIcon: {
    fontSize: 26,
  },
  navLogoText: {
    fontSize: 24,
    fontWeight: 800,
    color: '#e50914',
    letterSpacing: '-0.5px',
    textTransform: 'uppercase',
  },

  /* Center card */
  content: {
    position: 'relative',
    zIndex: 10,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 16px 60px',
  },
  card: {
    background: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 4,
    padding: '60px 68px',
    width: '100%',
    maxWidth: 450,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxSizing: 'border-box',
  },

  heading: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 28,
    letterSpacing: '-0.3px',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },

  fieldWrap: {
    position: 'relative',
  },

  input: {
    width: '100%',
    padding: '18px 16px',
    borderRadius: 4,
    border: '1px solid #454545',
    background: '#333',
    color: '#fff',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  },

  roleSection: {
    marginTop: 4,
  },
  roleLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 10,
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  roleCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '16px 12px',
    borderRadius: 4,
    border: '2px solid #454545',
    background: 'rgba(255,255,255,0.05)',
    cursor: 'pointer',
    color: '#fff',
    transition: 'all .15s',
  },
  roleCardActive: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '16px 12px',
    borderRadius: 4,
    border: '2px solid #e50914',
    background: 'rgba(229,9,20,0.12)',
    cursor: 'pointer',
    color: '#fff',
    transition: 'all .15s',
  },
  roleIcon: { fontSize: 26, marginBottom: 2 },
  roleName: { fontSize: 14, color: '#fff', fontWeight: 600 },
  roleDesc: { fontSize: 11, color: '#aaa' },
  roleCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#e50914',
    color: '#fff',
    fontSize: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
  },

  submitBtn: {
    width: '100%',
    padding: '16px',
    borderRadius: 4,
    background: '#e50914',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 700,
    marginTop: 8,
    fontFamily: 'inherit',
    letterSpacing: '0.3px',
    transition: 'background 0.15s',
  },

  error: {
    color: '#e87c7c',
    fontSize: 13,
    background: 'rgba(232,124,124,0.1)',
    border: '1px solid rgba(232,124,124,0.3)',
    borderRadius: 4,
    padding: '10px 12px',
    margin: 0,
  },

  toggleText: {
    color: '#737373',
    fontSize: 15,
    marginTop: 20,
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
    padding: 0,
    fontFamily: 'inherit',
  },

  note: {
    fontSize: 12,
    color: '#8c8c8c',
    marginTop: 16,
    lineHeight: 1.6,
  },
  noteLink: {
    color: '#737373',
    textDecoration: 'underline',
  },
}
