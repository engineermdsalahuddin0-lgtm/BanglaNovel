import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/shared/Navbar'
import CommentSection from '../components/shared/CommentSection'

export default function NovelDetail() {
  const { slug } = useParams()
  const { user, profile, isSubscribed } = useAuth()
  const navigate = useNavigate()
  const [novel, setNovel] = useState(null)
  const [chapters, setChapters] = useState([])
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNovel()
  }, [slug])

  async function fetchNovel() {
    const { data: novelData, error } = await supabase
      .from('novels')
      .select(`
        id, title, slug, description, cover_url, genre,
        status, is_free, is_featured, total_chapters,
        total_views, total_likes, writer_id,
        profiles!novels_writer_id_fkey(username, avatar_url)
      `)
      .eq('slug', slug)
      .single()

    if (error || !novelData) { navigate('/'); return }

    const { data: chaptersData } = await supabase
      .from('chapters')
      .select('id, chapter_number, title, is_free, word_count, published_at')
      .eq('novel_id', novelData.id)
      .order('chapter_number', { ascending: true })

    if (user) {
      const { data: likeData } = await supabase
        .from('likes')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('novel_id', novelData.id)
        .maybeSingle()
      setLiked(!!likeData)
    }

    await supabase
      .from('novels')
      .update({ total_views: (novelData.total_views || 0) + 1 })
      .eq('id', novelData.id)

    setNovel(novelData)
    setChapters(chaptersData || [])
    setLoading(false)
  }

  async function toggleLike() {
    if (!user) { navigate('/auth'); return }
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('novel_id', novel.id)
      setNovel(prev => ({ ...prev, total_likes: prev.total_likes - 1 }))
    } else {
      await supabase.from('likes').insert({ user_id: user.id, novel_id: novel.id })
      setNovel(prev => ({ ...prev, total_likes: prev.total_likes + 1 }))
    }
    setLiked(!liked)
  }

  function canReadChapter(chapter) {
    if (chapter.is_free) return true
    if (isSubscribed) return true
    if (profile?.role === 'admin' || profile?.role === 'writer') return true
    return false
  }

  if (loading) return <><Navbar /><div style={styles.loading}>লোড হচ্ছে...</div></>
  if (!novel) return <><Navbar /><div style={styles.loading}>বই পাওয়া যায়নি।</div></>

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.coverWrap}>
            {novel.cover_url
              ? <img src={novel.cover_url} alt={novel.title} style={styles.cover} />
              : <div style={styles.coverPlaceholder}>📖</div>
            }
          </div>
          <div style={styles.heroInfo}>
            <div style={styles.badges}>
              <span style={styles.genreBadge}>{novel.genre}</span>
              <span style={novel.status === 'completed' ? styles.completedBadge : styles.ongoingBadge}>
                {novel.status === 'completed' ? '✅ সম্পূর্ণ' : '🔄 চলমান'}
              </span>
              {!novel.is_free && <span style={styles.premiumBadge}>🔑 প্রিমিয়াম</span>}
            </div>
            <h1 style={styles.title}>{novel.title}</h1>
            <p style={styles.author}>✍️ {novel.profiles?.username}</p>
            <p style={styles.desc}>{novel.description}</p>
            <div style={styles.stats}>
              <span>👁 {novel.total_views} ভিউ</span>
              <span>📚 {novel.total_chapters} অধ্যায়</span>
              <span>❤️ {novel.total_likes} লাইক</span>
            </div>
            <div style={styles.actions}>
              {chapters.length > 0 && (
                <Link to={`/novel/${slug}/chapter/1`} style={styles.readBtn}>
                  📖 পড়া শুরু করো
                </Link>
              )}
              <button onClick={toggleLike} style={liked ? styles.likedBtn : styles.likeBtn}>
                {liked ? '❤️ লাইক করেছো' : '🤍 লাইক করো'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        <h2 style={styles.chapterTitle}>অধ্যায় তালিকা ({chapters.length}টি)</h2>

        <div style={styles.chapterList}>
          {chapters.map(chapter => {
            const canRead = canReadChapter(chapter)
            return (
              <div key={chapter.id} style={styles.chapterItem}>
                <div style={styles.chapterLeft}>
                  <span style={styles.chapterNum}>অধ্যায় {chapter.chapter_number}</span>
                  <span style={styles.chapterName}>{chapter.title}</span>
                  <span style={styles.chapterMeta}>{chapter.word_count} শব্দ</span>
                </div>
                <div style={styles.chapterRight}>
                  {!chapter.is_free && <span style={styles.lockBadge}>🔑</span>}
                  {canRead
                    ? <Link to={`/novel/${slug}/chapter/${chapter.chapter_number}`} style={styles.readChapterBtn}>পড়ো →</Link>
                    : <Link to="/subscribe" style={styles.lockBtn}>আনলক করো</Link>
                  }
                </div>
              </div>
            )
          })}
        </div>
        <div style={styles.content}>
          {/* existing chapter list code */}

          {/* Comment section — একদম নিচে */}
          <CommentSection novelId={novel.id} />
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f5f0' },
  loading: { padding: '4rem', textAlign: 'center', color: '#888' },
  hero: { background: 'linear-gradient(135deg, #1a1a2e, #16213e)', padding: '2.5rem 1.5rem' },
  heroInner: { maxWidth: 900, margin: '0 auto', display: 'flex', gap: '2rem', flexWrap: 'wrap' },
  coverWrap: { flexShrink: 0 },
  cover: { width: 160, height: 220, objectFit: 'cover', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.4)' },
  coverPlaceholder: { width: 160, height: 220, background: '#2a2a4a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 },
  heroInfo: { flex: 1, minWidth: 240 },
  badges: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  genreBadge: { fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#2a2a4a', color: '#aab4c8' },
  ongoingBadge: { fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#1a3a2a', color: '#4caf7d' },
  completedBadge: { fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#1a2a3a', color: '#4a9af0' },
  premiumBadge: { fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#3a1a2a', color: '#e94560' },
  title: { fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.2 },
  author: { fontSize: 14, color: '#aab4c8', marginBottom: 12 },
  desc: { fontSize: 14, color: '#8892a4', lineHeight: 1.7, marginBottom: 16 },
  stats: { display: 'flex', gap: 20, color: '#aab4c8', fontSize: 13, marginBottom: 20 },
  actions: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  readBtn: { padding: '11px 24px', borderRadius: 8, background: '#e94560', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  likeBtn: { padding: '11px 20px', borderRadius: 8, border: '1px solid #444', color: '#ccc', background: 'transparent', cursor: 'pointer', fontSize: 14 },
  likedBtn: { padding: '11px 20px', borderRadius: 8, border: '1px solid #e94560', color: '#e94560', background: 'transparent', cursor: 'pointer', fontSize: 14 },
  content: { maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' },
  chapterTitle: { fontSize: 20, fontWeight: 600, color: '#1a1a2e', marginBottom: '1rem' },
  chapterList: { display: 'flex', flexDirection: 'column', gap: 8 },
  chapterItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #e8e8e8', flexWrap: 'wrap', gap: 8 },
  chapterLeft: { display: 'flex', flexDirection: 'column', gap: 3 },
  chapterNum: { fontSize: 11, color: '#aaa', fontWeight: 500 },
  chapterName: { fontSize: 14, fontWeight: 500, color: '#1a1a2e' },
  chapterMeta: { fontSize: 11, color: '#bbb' },
  chapterRight: { display: 'flex', alignItems: 'center', gap: 10 },
  lockBadge: { fontSize: 14 },
  readChapterBtn: { padding: '7px 16px', borderRadius: 6, background: '#1a1a2e', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 500 },
  lockBtn: { padding: '7px 16px', borderRadius: 6, background: '#f5f5f0', color: '#888', textDecoration: 'none', fontSize: 13, border: '1px solid #e8e8e8' }
}
