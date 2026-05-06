import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function ChapterReader() {
  const { slug, chapterNum } = useParams()
  const { user, profile, isSubscribed } = useAuth()
  const navigate = useNavigate()
  const [novel, setNovel] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [totalChapters, setTotalChapters] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fontSize, setFontSize] = useState(18)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    fetchChapter()
  }, [slug, chapterNum])

  async function fetchChapter() {
    setLoading(true)

    // novel আনো
    const { data: novelData } = await supabase
      .from('novels')
      .select('id, title, slug, total_chapters')
      .eq('slug', slug)
      .single()

    if (!novelData) { navigate('/'); return }

    // chapter আনো
    const { data: chapterData } = await supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novelData.id)
      .eq('chapter_number', parseInt(chapterNum))
      .single()

    if (!chapterData) { navigate(`/novel/${slug}`); return }

    // paid chapter হলে check করো
    if (!chapterData.is_free) {
      const canRead = isSubscribed || profile?.role === 'admin' || profile?.role === 'writer'
      if (!canRead) { navigate(`/novel/${slug}`); return }
    }

    // reading history save করো
    if (user) {
      await supabase.from('reads').upsert({
        user_id: user.id,
        chapter_id: chapterData.id,
        novel_id: novelData.id
      }, { onConflict: 'user_id,chapter_id' })
    }

    // view count বাড়াও
    await supabase
      .from('chapters')
      .update({ views: (chapterData.views || 0) + 1 })
      .eq('id', chapterData.id)

    setNovel(novelData)
    setChapter(chapterData)
    setTotalChapters(novelData.total_chapters)
    setLoading(false)
  }

  const currentNum = parseInt(chapterNum)
  const hasPrev = currentNum > 1
  const hasNext = currentNum < totalChapters

  const bg = darkMode ? '#1a1a2e' : '#faf9f6'
  const textColor = darkMode ? '#e8e0d0' : '#2c2c2c'
  const cardBg = darkMode ? '#16213e' : '#fff'

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#888' }}>লোড হচ্ছে...</div>

  return (
    <div className="reader-content" style={{ minHeight: '100vh', background: bg, transition: 'background .2s' }}>

      {/* Top bar */}
      <div style={{ ...styles.topBar, background: cardBg, borderBottom: `1px solid ${darkMode ? '#2a2a4a' : '#e8e8e8'}` }}>
        <Link to={`/novel/${slug}`} style={{ ...styles.backBtn, color: darkMode ? '#aaa' : '#666' }}>
          ← ফিরে যাও
        </Link>
        <div style={styles.topCenter}>
          <p style={{ ...styles.topNovel, color: darkMode ? '#aaa' : '#888' }}>{novel?.title}</p>
          <p style={{ ...styles.topChapter, color: darkMode ? '#fff' : '#1a1a2e' }}>{chapter?.title}</p>
        </div>
        <div style={styles.topControls}>
          <button onClick={() => setFontSize(f => Math.max(14, f - 2))} style={styles.controlBtn}>A-</button>
          <button onClick={() => setFontSize(f => Math.min(24, f + 2))} style={styles.controlBtn}>A+</button>
          <button onClick={() => setDarkMode(!darkMode)} style={styles.controlBtn}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={styles.readerWrap}>
        <div style={{ ...styles.readerCard, background: cardBg }}>

          <h2 style={{ ...styles.chapterTitle, color: textColor }}>
            অধ্যায় {currentNum} — {chapter?.title}
          </h2>

          <div style={{ ...styles.chapterMeta, color: darkMode ? '#666' : '#aaa' }}>
            {chapter?.word_count} শব্দ · {Math.ceil(chapter?.word_count / 200)} মিনিট পড়া
          </div>

          <div style={{ ...styles.content, fontSize: fontSize, color: textColor, lineHeight: 2 }}>
            {chapter?.content.split('\n').map((para, i) =>
              para.trim() ? <p key={i} style={{ marginBottom: '1.2em' }}>{para}</p> : null
            )}
          </div>

          {/* Navigation */}
          <div style={styles.navRow}>
            {hasPrev
              ? <Link to={`/novel/${slug}/chapter/${currentNum - 1}`} style={styles.navBtn}>← আগের অধ্যায়</Link>
              : <div />
            }
            <Link to={`/novel/${slug}`} style={styles.indexBtn}>সূচিপত্র</Link>
            {hasNext
              ? <Link to={`/novel/${slug}/chapter/${currentNum + 1}`} style={styles.navBtn}>পরের অধ্যায় →</Link>
              : <div style={{ ...styles.navBtn, opacity: .3, cursor: 'default' }}>শেষ অধ্যায়</div>
            }
          </div>

        </div>
      </div>
    </div>
  )
}

const styles = {
  topBar: {
    position: 'sticky', top: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 1.5rem', height: 56, gap: 12
  },
  backBtn: { textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap' },
  topCenter: { textAlign: 'center', flex: 1 },
  topNovel: { fontSize: 11, margin: 0 },
  topChapter: { fontSize: 14, fontWeight: 500, margin: 0 },
  topControls: { display: 'flex', gap: 6 },
  controlBtn: {
    padding: '5px 10px', borderRadius: 6, border: '1px solid #e8e8e8',
    background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'inherit'
  },
  readerWrap: { maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' },
  readerCard: { borderRadius: 16, padding: '2.5rem', boxShadow: '0 2px 16px rgba(0,0,0,.06)' },
  chapterTitle: { fontSize: 22, fontWeight: 600, marginBottom: 8 },
  chapterMeta: { fontSize: 13, marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e8e8e8' },
  content: { fontFamily: 'Georgia, serif' },
  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #e8e8e8', flexWrap: 'wrap', gap: 10 },
  navBtn: { padding: '10px 20px', borderRadius: 8, background: '#1a1a2e', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  indexBtn: { padding: '10px 20px', borderRadius: 8, border: '1px solid #e8e8e8', color: '#666', textDecoration: 'none', fontSize: 14 }
}
