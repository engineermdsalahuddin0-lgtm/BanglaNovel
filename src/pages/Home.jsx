import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/shared/Navbar'
import NovelCard from '../components/shared/NovelCard'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { profile, isSubscribed } = useAuth()
  const [featured, setFeatured] = useState([])
  const [latest, setLatest] = useState([])
  const [popular, setPopular] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNovels()
  }, [])

  async function fetchNovels() {
    const { data: featuredData } = await supabase
      .from('novels')
      .select(`
        id, title, slug, description, cover_url, genre,
        status, is_free, is_featured, total_chapters,
        total_views, total_likes, writer_id,
        profiles!novels_writer_id_fkey(username)
      `)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(4)

    const { data: latestData } = await supabase
      .from('novels')
      .select(`
        id, title, slug, description, cover_url, genre,
        status, is_free, is_featured, total_chapters,
        total_views, total_likes, writer_id,
        profiles!novels_writer_id_fkey(username)
      `)
      .order('created_at', { ascending: false })
      .limit(8)

    const { data: popularData } = await supabase
      .from('novels')
      .select(`
        id, title, slug, description, cover_url, genre,
        status, is_free, is_featured, total_chapters,
        total_views, total_likes, writer_id,
        profiles!novels_writer_id_fkey(username)
      `)
      .order('total_views', { ascending: false })
      .limit(8)

    setFeatured(featuredData || [])
    setLatest(latestData || [])
    setPopular(popularData || [])
    setLoading(false)
  }

  if (loading) return (
    <>
      <Navbar />
      <div style={styles.loading}>লোড হচ্ছে...</div>
    </>
  )

  return (
    <div style={styles.page}>
      <Navbar />

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <h1 style={styles.heroTitle}>বাংলা গল্পের নতুন জগৎ</h1>
          <p style={styles.heroSub}>হাজারো বাংলা উপন্যাস, একটি প্ল্যাটফর্মে। পড়ো, লেখো, উপভোগ করো।</p>
          <div style={styles.heroBtns}>
            <Link to="/novels" style={styles.heroBtn}>সব বই দেখো</Link>
            {!isSubscribed && (
              <Link to="/subscribe" style={styles.heroBtnOutline}>প্রিমিয়াম নাও</Link>
            )}
          </div>
          <div style={styles.stats}>
            <div style={styles.stat}><strong>১০০+</strong><span>উপন্যাস</span></div>
            <div style={styles.stat}><strong>৫০+</strong><span>লেখক</span></div>
            <div style={styles.stat}><strong>৫০০+</strong><span>পাঠক</span></div>
          </div>
        </div>
      </div>

      <div style={styles.content}>

        {!isSubscribed && (
          <div style={styles.subBanner}>
            <div>
              <strong>🔑 প্রিমিয়াম মেম্বার হও</strong>
              <p style={{ margin: '4px 0 0', fontSize: 13, opacity: .85 }}>মাত্র ৳৪৯/মাসে সব premium chapter পড়ো, বিজ্ঞাপন ছাড়া।</p>
            </div>
            <Link to="/subscribe" style={styles.subBtn}>এখনই নাও</Link>
          </div>
        )}

        {featured.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>⭐ ফিচার্ড উপন্যাস</h2>
            </div>
            <div style={styles.grid}>
              {featured.map(novel => <NovelCard key={novel.id} novel={novel} />)}
            </div>
          </section>
        )}

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>🆕 নতুন আপডেট</h2>
            <Link to="/novels?sort=latest" style={styles.seeAll}>সব দেখো →</Link>
          </div>
          {latest.length === 0
            ? <div style={styles.empty}>এখনো কোনো বই নেই। <Link to="/writer">প্রথম বই লেখো!</Link></div>
            : <div style={styles.grid}>{latest.map(novel => <NovelCard key={novel.id} novel={novel} />)}</div>
          }
        </section>

        {popular.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>🔥 জনপ্রিয় উপন্যাস</h2>
              <Link to="/novels?sort=popular" style={styles.seeAll}>সব দেখো →</Link>
            </div>
            <div style={styles.grid}>
              {popular.map(novel => <NovelCard key={novel.id} novel={novel} />)}
            </div>
          </section>
        )}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>📂 ঘরানা অনুযায়ী</h2>
          <div style={styles.genreGrid}>
            {[
              { label: '💕 রোমান্স', value: 'romance' },
              { label: '⚔️ ফ্যান্টাসি', value: 'fantasy' },
              { label: '🔍 থ্রিলার', value: 'thriller' },
              { label: '👻 হরর', value: 'horror' },
              { label: '📚 অন্যান্য', value: 'other' },
            ].map(g => (
              <Link key={g.value} to={`/novels?genre=${g.value}`} style={styles.genreBtn}>
                {g.label}
              </Link>
            ))}
          </div>
        </section>

      </div>

      <footer style={styles.footer}>
        <p>© ২০২৪ WebNovel BD · বাংলা সাহিত্যের নতুন ঠিকানা</p>
      </footer>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f5f0' },
  loading: { padding: '4rem', textAlign: 'center', color: '#888', fontSize: 16 },
  hero: { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '4rem 1.5rem 3rem' },
  heroInner: { maxWidth: 900, margin: '0 auto', textAlign: 'center' },
  heroTitle: { fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 12, lineHeight: 1.2 },
  heroSub: { fontSize: 16, color: '#aab4c8', marginBottom: '1.5rem', lineHeight: 1.6 },
  heroBtns: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' },
  heroBtn: { padding: '12px 28px', borderRadius: 8, background: '#e94560', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15 },
  heroBtnOutline: { padding: '12px 28px', borderRadius: 8, border: '1px solid #fff', color: '#fff', textDecoration: 'none', fontWeight: 500, fontSize: 15 },
  stats: { display: 'flex', justifyContent: 'center', gap: '2rem' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff', gap: 2 },
  content: { maxWidth: 1100, margin: '0 auto', padding: '1.5rem' },
  subBanner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'linear-gradient(135deg, #e94560, #c23152)',
    color: '#fff', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12
  },
  subBtn: { padding: '8px 20px', borderRadius: 8, background: '#fff', color: '#e94560', textDecoration: 'none', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' },
  section: { marginBottom: '2.5rem' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sectionTitle: { fontSize: 20, fontWeight: 600, color: '#1a1a2e' },
  seeAll: { fontSize: 13, color: '#e94560', textDecoration: 'none', fontWeight: 500 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  empty: { textAlign: 'center', padding: '3rem', color: '#888', background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8' },
  genreGrid: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  genreBtn: {
    padding: '10px 20px', borderRadius: 24, background: '#fff',
    border: '1px solid #e8e8e8', textDecoration: 'none', color: '#333',
    fontSize: 14, fontWeight: 500
  },
  footer: { textAlign: 'center', padding: '2rem', color: '#aaa', fontSize: 13, borderTop: '1px solid #e8e8e8', marginTop: '2rem' }
}
