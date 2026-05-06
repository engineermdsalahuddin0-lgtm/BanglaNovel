import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Scroll Animation Hook ───────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
          }
        })
      },
      { threshold: 0.15 }
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

// ─── Mock Novel Data ─────────────────────────────────────────────────────────
const FEATURED_NOVELS = [
  { id: 1, title: 'রক্তের ঋণ', genre: 'থ্রিলার', chapters: 48, views: '১.২ লাখ', color: '#7b1e1e' },
  { id: 2, title: 'নীল আকাশের নিচে', genre: 'রোমান্স', chapters: 62, views: '৮৫ হাজার', color: '#1a3a5c' },
  { id: 3, title: 'ছায়া মানুষ', genre: 'রহস্য', chapters: 35, views: '৬৩ হাজার', color: '#2d1b4e' },
  { id: 4, title: 'স্বপ্নের বাজার', genre: 'ফ্যান্টাসি', chapters: 91, views: '২.১ লাখ', color: '#1a4a2e' },
  { id: 5, title: 'শেষ চিঠি', genre: 'নাটকীয়', chapters: 27, views: '৪৫ হাজার', color: '#4a3010' },
  { id: 6, title: 'অন্ধকার পথ', genre: 'অ্যাকশন', chapters: 55, views: '৯৭ হাজার', color: '#2a1a0e' },
]

const GENRES = ['থ্রিলার', 'রোমান্স', 'ফ্যান্টাসি', 'রহস্য', 'ইতিহাস', 'অ্যাকশন', 'নাটকীয়', 'হরর']

const STATS = [
  { number: '৫০০+', label: 'উপন্যাস' },
  { number: '১০,০০০+', label: 'পাঠক' },
  { number: '২০০+', label: 'লেখক' },
  { number: '৫০,০০০+', label: 'অধ্যায়' },
]

// ─── Novel Card Component ─────────────────────────────────────────────────────
function NovelCard({ novel, index }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: hovered ? 'scale(1.06) translateY(-4px)' : 'scale(1)',
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease',
        boxShadow: hovered
          ? '0 24px 48px rgba(0,0,0,0.7)'
          : '0 4px 16px rgba(0,0,0,0.4)',
        animationDelay: `${index * 0.08}s`,
      }}
    >
      {/* Book Cover */}
      <div
        style={{
          width: '100%',
          aspectRatio: '2/3',
          background: `linear-gradient(160deg, ${novel.color} 0%, #0a0a0a 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.2rem',
          position: 'relative',
        }}
      >
        {/* Decorative lines */}
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, height: '1px', background: 'rgba(255,255,255,0.15)' }} />
        <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, height: '1px', background: 'rgba(255,255,255,0.15)' }} />
        <div
          style={{
            fontSize: '1rem',
            fontFamily: '"Noto Serif Bengali", serif',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '0.75rem',
            fontSize: '0.65rem',
          }}
        >
          {novel.genre}
        </div>
        <div
          style={{
            fontSize: '1.1rem',
            fontFamily: '"Noto Serif Bengali", serif',
            color: '#fff',
            textAlign: 'center',
            fontWeight: '700',
            lineHeight: 1.4,
          }}
        >
          {novel.title}
        </div>
        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'Hind Siliguri, sans-serif' }}>
            {novel.chapters} অধ্যায়
          </span>
        </div>

        {/* Hover overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#c0392b', fontFamily: 'Hind Siliguri, sans-serif', marginBottom: '0.3rem' }}>
            👁 {novel.views} পাঠক
          </div>
          <button
            style={{
              background: '#c0392b',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '0.4rem 0.8rem',
              fontSize: '0.75rem',
              fontFamily: 'Hind Siliguri, sans-serif',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            পড়া শুরু করুন →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const [scrollY, setScrollY] = useState(0)
  const [activeGenre, setActiveGenre] = useState('থ্রিলার')
  const [emailInput, setEmailInput] = useState('')

  useScrollReveal()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const styles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #080808; overflow-x: hidden; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(40px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes floatBook {
      0%, 100% { transform: translateY(0px) rotate(-3deg); }
      50%       { transform: translateY(-18px) rotate(-3deg); }
    }
    @keyframes pulse-ring {
      0%   { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(1.8); opacity: 0; }
    }
    @keyframes ticker {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50%       { background-position: 100% 50%; }
    }

    .reveal {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.7s ease, transform 0.7s ease;
    }
    .reveal.revealed {
      opacity: 1;
      transform: translateY(0);
    }
    .hero-title {
      animation: fadeUp 1s ease 0.2s both;
    }
    .hero-sub {
      animation: fadeUp 1s ease 0.5s both;
    }
    .hero-cta {
      animation: fadeUp 1s ease 0.8s both;
    }
    .hero-badge {
      animation: fadeIn 1s ease 0.1s both;
    }
    .novel-row-card {
      animation: fadeUp 0.6s ease both;
    }
    .shimmer-text {
      background: linear-gradient(90deg, #b8860b, #f0d060, #b8860b, #f0d060);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 3s linear infinite;
    }
    .genre-pill {
      transition: all 0.25s ease;
      cursor: pointer;
    }
    .genre-pill:hover {
      transform: translateY(-2px);
    }
    .stat-card {
      transition: transform 0.3s ease;
    }
    .stat-card:hover {
      transform: translateY(-6px);
    }
    .plan-card {
      transition: transform 0.35s ease, box-shadow 0.35s ease;
    }
    .plan-card:hover {
      transform: translateY(-8px);
    }
    .nav-link {
      transition: color 0.2s ease;
      cursor: pointer;
    }
    .nav-link:hover {
      color: #c0392b !important;
    }
    .ticker-inner {
      display: flex;
      gap: 4rem;
      animation: ticker 25s linear infinite;
      width: max-content;
    }

    @media (max-width: 768px) {
      .hero-title-text { font-size: 3rem !important; }
      .novel-grid { grid-template-columns: repeat(3, 1fr) !important; }
      .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .plans-grid { grid-template-columns: 1fr !important; }
      .features-grid { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 480px) {
      .hero-title-text { font-size: 2.2rem !important; }
      .novel-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
  `

  return (
    <>
      <style>{styles}</style>

      <div style={{ background: '#080808', minHeight: '100vh', color: '#fff', fontFamily: 'Hind Siliguri, sans-serif' }}>

        {/* ── NAVBAR ─────────────────────────────────────────────────── */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '1rem 4%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: scrollY > 60
            ? 'rgba(8,8,8,0.97)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
          backdropFilter: scrollY > 60 ? 'blur(12px)' : 'none',
          borderBottom: scrollY > 60 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          transition: 'all 0.4s ease',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 36, height: 36,
              background: '#c0392b',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              fontWeight: '900',
              fontFamily: '"Noto Serif Bengali", serif',
              boxShadow: '0 0 20px rgba(192,57,43,0.5)',
            }}>ব</div>
            <span style={{
              fontSize: '1.3rem',
              fontWeight: '800',
              fontFamily: '"Playfair Display", serif',
              letterSpacing: '-0.02em',
            }}>
              WebNovel <span style={{ color: '#c0392b' }}>BD</span>
            </span>
          </div>

          {/* Nav Links */}
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            {['উপন্যাস', 'লেখক হন', 'সাবস্ক্রিপশন'].map(link => (
              <span key={link} className="nav-link" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)' }}>
                {link}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/auth')}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                padding: '0.45rem 1.2rem',
                borderRadius: '4px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontFamily: 'Hind Siliguri, sans-serif',
                transition: 'border-color 0.2s ease',
              }}
            >
              লগইন
            </button>
            <button
              onClick={() => navigate('/auth')}
              style={{
                background: '#c0392b',
                border: 'none',
                color: '#fff',
                padding: '0.45rem 1.2rem',
                borderRadius: '4px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontFamily: 'Hind Siliguri, sans-serif',
                fontWeight: '600',
                boxShadow: '0 0 16px rgba(192,57,43,0.4)',
              }}
            >
              বিনামূল্যে শুরু করুন
            </button>
          </div>
        </nav>

        {/* ── HERO ───────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          style={{
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Animated background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #1a0a08 0%, #080808 70%)',
          }} />

          {/* Parallax grid lines */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(192,57,43,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(192,57,43,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            transform: `translateY(${scrollY * 0.15}px)`,
          }} />

          {/* Floating book cards (decorative) */}
          <div style={{
            position: 'absolute',
            right: '5%',
            top: '10%',
            bottom: '10%',
            width: '40%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translateY(${scrollY * -0.08}px)`,
          }}>
            <div style={{ position: 'relative', width: 320, height: 400 }}>
              {FEATURED_NOVELS.slice(0, 4).map((n, i) => (
                <div key={n.id} style={{
                  position: 'absolute',
                  width: 140,
                  height: 200,
                  borderRadius: '8px',
                  background: `linear-gradient(150deg, ${n.color} 0%, #0a0a0a 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 20px 60px rgba(0,0,0,0.7)`,
                  border: '1px solid rgba(255,255,255,0.08)',
                  top: [0, 80, 160, 40][i],
                  left: [0, 90, 30, 150][i],
                  transform: [`rotate(-6deg)`, `rotate(3deg)`, `rotate(-2deg)`, `rotate(7deg)`][i],
                  animation: `floatBook ${3 + i * 0.7}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                  zIndex: 4 - i,
                }}>
                  <span style={{
                    fontFamily: '"Noto Serif Bengali", serif',
                    fontSize: '0.8rem',
                    color: 'rgba(255,255,255,0.8)',
                    textAlign: 'center',
                    padding: '0.5rem',
                  }}>{n.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero content */}
          <div style={{ position: 'relative', zIndex: 10, padding: '8rem 4% 4rem', maxWidth: '55%' }}>
            <div className="hero-badge" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(192,57,43,0.15)',
              border: '1px solid rgba(192,57,43,0.3)',
              borderRadius: '50px',
              padding: '0.3rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.8rem',
              color: '#e05a4a',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c0392b', display: 'inline-block', boxShadow: '0 0 8px #c0392b' }} />
              বাংলাদেশের প্রথম ওয়েব নভেল প্ল্যাটফর্ম
            </div>

            <h1 className="hero-title hero-title-text" style={{
              fontSize: '4.5rem',
              fontFamily: '"Playfair Display", serif',
              fontWeight: '900',
              lineHeight: 1.1,
              marginBottom: '1.5rem',
              letterSpacing: '-0.03em',
            }}>
              গল্পের জগতে<br />
              <span className="shimmer-text">স্বাগতম</span>
            </h1>

            <p className="hero-sub" style={{
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.8,
              marginBottom: '2.5rem',
              fontFamily: '"Noto Serif Bengali", serif',
              maxWidth: 500,
            }}>
              হাজারো বাংলা উপন্যাস, রোমাঞ্চকর গল্প, আর প্রতিভাবান লেখকদের সাথে পরিচিত হোন। পড়ুন, লিখুন, উপভোগ করুন।
            </p>

            <div className="hero-cta" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/auth')}
                style={{
                  background: '#c0392b',
                  border: 'none',
                  color: '#fff',
                  padding: '0.9rem 2.5rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontFamily: 'Hind Siliguri, sans-serif',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 0 30px rgba(192,57,43,0.5)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                এখনই পড়া শুরু করুন →
              </button>
              <button
                onClick={() => navigate('/auth')}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  padding: '0.9rem 2rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontFamily: 'Hind Siliguri, sans-serif',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                ▶ লেখক হন
              </button>
            </div>

            {/* Trust badges */}
            <div style={{
              marginTop: '3rem',
              display: 'flex',
              gap: '2rem',
              flexWrap: 'wrap',
            }}>
              {STATS.map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#b8860b', fontFamily: '"Playfair Display", serif' }}>
                    {s.number}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom fade */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(to bottom, transparent, #080808)',
          }} />
        </section>

        {/* ── TICKER ─────────────────────────────────────────────────── */}
        <div style={{
          background: '#c0392b',
          padding: '0.6rem 0',
          overflow: 'hidden',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div className="ticker-inner">
            {[...GENRES, ...GENRES].map((g, i) => (
              <span key={i} style={{
                fontSize: '0.8rem',
                fontFamily: '"Noto Serif Bengali", serif',
                color: 'rgba(255,255,255,0.9)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}>
                {g} <span style={{ opacity: 0.5 }}>✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── FEATURED NOVELS ROW ─────────────────────────────────────── */}
        <section style={{ padding: '5rem 4%' }}>
          <div className="reveal" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#c0392b', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                এখন জনপ্রিয়
              </div>
              <h2 style={{ fontSize: '2rem', fontFamily: '"Playfair Display", serif', fontWeight: '700' }}>
                ট্রেন্ডিং উপন্যাস
              </h2>
            </div>
            <span style={{ color: '#c0392b', fontSize: '0.9rem', cursor: 'pointer' }}>সব দেখুন →</span>
          </div>

          <div className="novel-grid reveal" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '1rem',
          }}>
            {FEATURED_NOVELS.map((novel, i) => (
              <NovelCard key={novel.id} novel={novel} index={i} />
            ))}
          </div>
        </section>

        {/* ── GENRE PILLS ────────────────────────────────────────────── */}
        <section style={{ padding: '2rem 4% 5rem' }}>
          <div className="reveal" style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#c0392b', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              ধরন অনুযায়ী
            </div>
            <h2 style={{ fontSize: '2rem', fontFamily: '"Playfair Display", serif', fontWeight: '700' }}>
              আপনার পছন্দের গল্প খুঁজুন
            </h2>
          </div>

          <div className="reveal" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
            {GENRES.map(genre => (
              <button
                key={genre}
                className="genre-pill"
                onClick={() => setActiveGenre(genre)}
                style={{
                  background: activeGenre === genre ? '#c0392b' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${activeGenre === genre ? '#c0392b' : 'rgba(255,255,255,0.12)'}`,
                  color: activeGenre === genre ? '#fff' : 'rgba(255,255,255,0.65)',
                  padding: '0.5rem 1.2rem',
                  borderRadius: '50px',
                  fontSize: '0.85rem',
                  fontFamily: 'Hind Siliguri, sans-serif',
                  cursor: 'pointer',
                  boxShadow: activeGenre === genre ? '0 0 16px rgba(192,57,43,0.3)' : 'none',
                }}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Active genre novels */}
          <div className="reveal" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1rem',
          }}>
            {FEATURED_NOVELS.slice(0, 4).map((novel, i) => (
              <NovelCard key={`${activeGenre}-${i}`} novel={{ ...novel, genre: activeGenre }} index={i} />
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
        <section style={{
          padding: '5rem 4%',
          background: 'rgba(255,255,255,0.02)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#c0392b', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              কীভাবে কাজ করে
            </div>
            <h2 style={{ fontSize: '2.2rem', fontFamily: '"Playfair Display", serif', fontWeight: '700' }}>
              পড়া শুরু করুন মাত্র ৩ ধাপে
            </h2>
          </div>

          <div className="features-grid reveal" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem',
          }}>
            {[
              { step: '০১', icon: '📝', title: 'অ্যাকাউন্ট তৈরি করুন', desc: 'ইমেইল দিয়ে বিনামূল্যে সাইন আপ করুন। পাঠক বা লেখক — যেকোনো ভূমিকা বেছে নিন।' },
              { step: '০২', icon: '📚', title: 'গল্প বেছে নিন', desc: 'হাজারো উপন্যাস থেকে আপনার পছন্দের ধরন, লেখক বা জনপ্রিয়তা অনুযায়ী বেছে নিন।' },
              { step: '০৩', icon: '✨', title: 'পড়ুন ও উপভোগ করুন', desc: 'ডার্ক মোড, ফন্ট সাইজ কাস্টমাইজ করুন। লেখককে টিপস দিন, রেটিং দিন।' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '2.5rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: -10,
                  right: 16,
                  fontSize: '5rem',
                  fontWeight: '900',
                  color: 'rgba(192,57,43,0.08)',
                  fontFamily: '"Playfair Display", serif',
                  lineHeight: 1,
                }}>
                  {item.step}
                </div>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{item.icon}</div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontFamily: '"Noto Serif Bengali", serif',
                  fontWeight: '700',
                  marginBottom: '0.75rem',
                  color: '#fff',
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.8,
                  fontFamily: '"Noto Serif Bengali", serif',
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOR WRITERS ────────────────────────────────────────────── */}
        <section style={{ padding: '6rem 4%', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            right: '-10%',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(192,57,43,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 600 }}>
            <div className="reveal">
              <div style={{ fontSize: '0.75rem', color: '#c0392b', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                লেখকদের জন্য
              </div>
              <h2 style={{ fontSize: '2.5rem', fontFamily: '"Playfair Display", serif', fontWeight: '700', marginBottom: '1.5rem', lineHeight: 1.2 }}>
                আপনার গল্প বিশ্বের কাছে পৌঁছে দিন
              </h2>
              <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.9, fontFamily: '"Noto Serif Bengali", serif', marginBottom: '2rem' }}>
                বাংলাদেশের বৃহত্তম পাঠক সমাজের কাছে আপনার উপন্যাস শেয়ার করুন। টিপস পান, কন্ট্র্যাক্ট পান, পুরস্কার জিতুন।
              </p>
            </div>

            <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
              {[
                { icon: '💰', label: 'টিপস থেকে আয়', value: '৭০% আপনার' },
                { icon: '🏆', label: 'রাইটিং কন্টেস্ট', value: 'পুরস্কার জিতুন' },
                { icon: '📄', label: 'এক্সক্লুসিভ কন্ট্র্যাক্ট', value: 'মাসিক বেতন' },
                { icon: '🤖', label: 'AI লেখার টুলস', value: 'শীঘ্রই আসছে' },
              ].map((f, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#b8860b' }}>{f.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="reveal">
              <button
                onClick={() => navigate('/auth')}
                style={{
                  background: 'transparent',
                  border: '2px solid #c0392b',
                  color: '#c0392b',
                  padding: '0.9rem 2.5rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontFamily: 'Hind Siliguri, sans-serif',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => {
                  e.target.style.background = '#c0392b'
                  e.target.style.color = '#fff'
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'transparent'
                  e.target.style.color = '#c0392b'
                }}
              >
                লেখক হিসেবে যোগ দিন →
              </button>
            </div>
          </div>
        </section>

        {/* ── SUBSCRIPTION PLANS ─────────────────────────────────────── */}
        <section style={{
          padding: '6rem 4%',
          background: 'rgba(255,255,255,0.02)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#c0392b', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              সাবস্ক্রিপশন
            </div>
            <h2 style={{ fontSize: '2.2rem', fontFamily: '"Playfair Display", serif', fontWeight: '700', marginBottom: '0.75rem' }}>
              আপনার বাজেটে সেরা অভিজ্ঞতা
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', fontFamily: '"Noto Serif Bengali", serif' }}>
              bKash / Nagad এর মাধ্যমে সহজ পেমেন্ট
            </p>
          </div>

          <div className="plans-grid reveal" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            maxWidth: 900,
            margin: '0 auto',
          }}>
            {[
              {
                name: 'ফ্রি',
                price: '৳০',
                period: '/মাস',
                features: ['বিনামূল্যে অধ্যায় পড়ুন', 'সীমিত উপন্যাস', 'বিজ্ঞাপন সহ', 'কমেন্ট ও রেটিং'],
                cta: 'শুরু করুন',
                highlight: false,
              },
              {
                name: 'বেসিক',
                price: '৳৪৯',
                period: '/মাস',
                features: ['সব বিনামূল্যে কন্টেন্ট', 'বিজ্ঞাপনমুক্ত', 'প্রিমিয়াম অধ্যায়', 'পয়েন্ট বোনাস ২x'],
                cta: 'সাবস্ক্রাইব করুন',
                highlight: true,
                badge: 'জনপ্রিয়',
              },
              {
                name: 'প্রিমিয়াম',
                price: '৳৯৯',
                period: '/মাস',
                features: ['সব বেসিক সুবিধা', 'আর্লি অ্যাক্সেস', 'লেখককে বেশি টিপস', 'AI টুলস অ্যাক্সেস'],
                cta: 'প্রিমিয়াম নিন',
                highlight: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className="plan-card"
                style={{
                  padding: '2.5rem',
                  borderRadius: '12px',
                  background: plan.highlight
                    ? 'linear-gradient(160deg, #1a0a08 0%, #2a0c0a 100%)'
                    : 'rgba(255,255,255,0.03)',
                  border: plan.highlight
                    ? '2px solid #c0392b'
                    : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: plan.highlight ? '0 0 40px rgba(192,57,43,0.2)' : 'none',
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/auth')}
              >
                {plan.badge && (
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#c0392b',
                    color: '#fff',
                    padding: '0.2rem 1rem',
                    borderRadius: '50px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    fontFamily: 'Hind Siliguri, sans-serif',
                    whiteSpace: 'nowrap',
                  }}>
                    ✦ {plan.badge}
                  </div>
                )}
                <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{plan.name}</div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: '"Playfair Display", serif', color: plan.highlight ? '#c0392b' : '#fff' }}>
                    {plan.price}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: '2rem' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.6rem',
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.65)',
                      fontFamily: '"Noto Serif Bengali", serif',
                    }}>
                      <span style={{ color: '#b8860b', fontSize: '0.7rem' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: plan.highlight ? '#c0392b' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontFamily: 'Hind Siliguri, sans-serif',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
        <section style={{ padding: '6rem 4%' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontFamily: '"Playfair Display", serif', fontWeight: '700' }}>
              পাঠক ও লেখকরা কী বলছেন
            </h2>
          </div>

          <div className="reveal" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
          }}>
            {[
              { name: 'রাহেলা খানম', role: 'পাঠক', text: 'এত সুন্দর রিডিং অভিজ্ঞতা আগে পাইনি। ডার্ক মোডে রাতে পড়তে দারুণ লাগে।', rating: 5 },
              { name: 'আরিফ হোসেন', role: 'লেখক', text: 'আমার প্রথম উপন্যাসে ৫০ হাজারেরও বেশি পাঠক পেয়েছি। টিপস থেকে আয়ও ভালো।', rating: 5 },
              { name: 'তানভীর আহমেদ', role: 'পাঠক', text: 'বাংলা সাহিত্যের এই ডিজিটাল রূপান্তর সত্যিই অসাধারণ। সব বয়সের জন্য।', rating: 5 },
            ].map((t, i) => (
              <div key={i} style={{
                padding: '2rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '1rem' }}>
                  {[...Array(t.rating)].map((_, j) => (
                    <span key={j} style={{ color: '#b8860b', fontSize: '0.8rem' }}>★</span>
                  ))}
                </div>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.9,
                  fontFamily: '"Noto Serif Bengali", serif',
                  marginBottom: '1.5rem',
                  fontStyle: 'italic',
                }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: `hsl(${i * 80 + 10}, 50%, 30%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                  }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ─────────────────────────────────────────────── */}
        <section style={{ padding: '6rem 4%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(192,57,43,0.12) 0%, transparent 70%)',
          }} />
          <div className="reveal" style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{
              fontSize: '3rem',
              fontFamily: '"Playfair Display", serif',
              fontWeight: '900',
              marginBottom: '1rem',
              lineHeight: 1.2,
            }}>
              আজই আপনার গল্পের যাত্রা শুরু করুন
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '1rem',
              marginBottom: '2.5rem',
              fontFamily: '"Noto Serif Bengali", serif',
            }}>
              বিনামূল্যে সাইন আপ করুন — কোনো ক্রেডিট কার্ড লাগবে না
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="আপনার ইমেইল লিখুন..."
                style={{
                  padding: '0.9rem 1.5rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontFamily: 'Hind Siliguri, sans-serif',
                  width: 300,
                  outline: 'none',
                  backdropFilter: 'blur(8px)',
                }}
              />
              <button
                onClick={() => navigate('/auth')}
                style={{
                  background: '#c0392b',
                  border: 'none',
                  color: '#fff',
                  padding: '0.9rem 2rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontFamily: 'Hind Siliguri, sans-serif',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 0 30px rgba(192,57,43,0.4)',
                }}
              >
                শুরু করুন →
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <footer style={{
          padding: '3rem 4% 2rem',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '3rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ width: 32, height: 32, background: '#c0392b', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontFamily: '"Noto Serif Bengali"' }}>ব</div>
              <span style={{ fontSize: '1.1rem', fontFamily: '"Playfair Display", serif', fontWeight: '700' }}>
                WebNovel <span style={{ color: '#c0392b' }}>BD</span>
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.8, fontFamily: '"Noto Serif Bengali", serif' }}>
              বাংলাদেশের প্রথম ডেডিকেটেড বাংলা ওয়েব নভেল প্ল্যাটফর্ম।
            </p>
          </div>
          {[
            { title: 'এক্সপ্লোর', links: ['হোম', 'উপন্যাস', 'লেখক', 'কন্টেস্ট'] },
            { title: 'লেখক', links: ['সাইন আপ', 'ড্যাশবোর্ড', 'কন্ট্র্যাক্ট', 'পুরস্কার'] },
            { title: 'সাপোর্ট', links: ['যোগাযোগ', 'FAQ', 'নীতিমালা', 'গোপনীয়তা'] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>{col.title}</div>
              {col.links.map(link => (
                <div key={link} style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.5rem', cursor: 'pointer' }}>{link}</div>
              ))}
            </div>
          ))}
        </footer>

        <div style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>
          © ২০২৪ WebNovel BD — সর্বস্বত্ব সংরক্ষিত
        </div>

      </div>
    </>
  )
}
