import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/shared/Navbar'

const GENRES = [
  { value: '', label: 'সব' },
  { value: 'romance', label: '💕 রোমান্স' },
  { value: 'fantasy', label: '⚔️ ফ্যান্টাসি' },
  { value: 'thriller', label: '🔍 থ্রিলার' },
  { value: 'horror', label: '👻 হরর' },
  { value: 'other', label: '📚 অন্যান্য' },
]

const SORTS = [
  { value: 'created_at', label: 'নতুন' },
  { value: 'total_views', label: 'জনপ্রিয়' },
  { value: 'total_likes', label: 'লাইক' },
  { value: 'total_chapters', label: 'অধ্যায়' },
]

const PER_PAGE = 12

export default function NovelList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const genre = searchParams.get('genre') || ''
  const sort = searchParams.get('sort') || 'created_at'
  const page = parseInt(searchParams.get('page') || '1')

  useEffect(() => { fetchNovels() }, [genre, sort, page, search])

  async function fetchNovels() {
    setLoading(true)
    let query = supabase
      .from('novels')
      .select(`id, title, slug, description, cover_url, genre,
        status, is_free, is_featured, total_chapters,
        total_views, total_likes, writer_id,
        profiles!novels_writer_id_fkey(username)`, { count: 'exact' })
      .order(sort, { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

    if (genre) query = query.eq('genre', genre)
    if (search) query = query.ilike('title', `%${search}%`)

    const { data, count } = await query
    setNovels(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  function setParam(key, value) {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value); else p.delete(key)
    p.delete('page')
    setSearchParams(p)
  }

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput)
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.header}>
        <div style={s.headerInner}>
          <div>
            <h1 style={s.headerTitle}>সব উপন্যাস</h1>
            <p style={s.headerSub}>{total}টি উপন্যাস</p>
          </div>
          <form onSubmit={handleSearch} style={s.searchForm}>
            <div style={s.searchWrap}>
              <span style={s.searchIcon}>🔍</span>
              <input
                style={s.searchInput}
                placeholder="উপন্যাস খোঁজো..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setSearch('') }} style={s.clearBtn}>✕</button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div style={s.body}>
        <aside style={s.sidebar}>
          <div style={s.filterBlock}>
            <p style={s.filterLabel}>ঘরানা</p>
            {GENRES.map(g => (
              <button key={g.value} onClick={() => setParam('genre', g.value)}
                style={genre === g.value ? s.filterBtnActive : s.filterBtn}>
                {g.label}
                {genre === g.value && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
            ))}
          </div>
          <div style={s.filterBlock}>
            <p style={s.filterLabel}>সাজানো</p>
            {SORTS.map(so => (
              <button key={so.value} onClick={() => setParam('sort', so.value)}
                style={sort === so.value ? s.filterBtnActive : s.filterBtn}>
                {so.label}
                {sort === so.value && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
            ))}
          </div>
        </aside>

        <main style={s.main}>
          {(genre || search) && (
            <div style={s.activeFilters}>
              {genre && <span style={s.chip}>{GENRES.find(g => g.value === genre)?.label} <button onClick={() => setParam('genre', '')} style={s.chipX}>✕</button></span>}
              {search && <span style={s.chip}>"{search}" <button onClick={() => { setSearch(''); setSearchInput('') }} style={s.chipX}>✕</button></span>}
              <button onClick={() => { setSearchParams({}); setSearch(''); setSearchInput('') }} style={s.clearAll}>সব মুছো</button>
            </div>
          )}

          {loading ? (
            <div style={s.grid}>{Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : novels.length === 0 ? (
            <div style={s.empty}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p style={{ color: '#687076', fontSize: 15, marginBottom: 16 }}>কোনো উপন্যাস পাওয়া যায়নি</p>
              <button onClick={() => { setSearchParams({}); setSearch(''); setSearchInput('') }} style={s.emptyBtn}>ফিল্টার সরাও</button>
            </div>
          ) : (
            <>
              <div style={s.grid}>{novels.map(novel => <NovelCard key={novel.id} novel={novel} />)}</div>
              {totalPages > 1 && (
                <div style={s.pagination}>
                  <button disabled={page <= 1} onClick={() => setParam('page', page - 1)} style={page <= 1 ? s.pageDisabled : s.pageBtn}>← আগে</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setParam('page', p)} style={p === page ? s.pageActive : s.pageBtn}>{p}</button>
                  ))}
                  <button disabled={page >= totalPages} onClick={() => setParam('page', page + 1)} style={page >= totalPages ? s.pageDisabled : s.pageBtn}>পরে →</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function NovelCard({ novel }) {
  return (
    <Link to={`/novel/${novel.slug}`} style={s.card}>
      <div style={s.cardCover}>
        {novel.cover_url
          ? <img src={novel.cover_url} alt={novel.title} style={s.cardImg} />
          : <div style={s.cardPlaceholder}><span style={{ fontSize: 40, opacity: .4 }}>📖</span></div>
        }
        {novel.is_featured && <div style={s.featuredDot} />}
      </div>
      <div style={s.cardInfo}>
        <div style={s.cardBadges}>
          <span style={s.genreTag}>{novel.genre}</span>
          <span style={novel.status === 'completed' ? s.completedTag : s.ongoingTag}>
            {novel.status === 'completed' ? 'সম্পূর্ণ' : 'চলমান'}
          </span>
          {!novel.is_free && <span style={s.premiumTag}>প্রিমিয়াম</span>}
        </div>
        <h3 style={s.cardTitle}>{novel.title}</h3>
        <p style={s.cardAuthor}>✍️ {novel.profiles?.username || 'লেখক'}</p>
        <p style={s.cardDesc}>{novel.description?.slice(0, 90)}...</p>
        <div style={s.cardFooter}>
          <span style={s.cardStat}>👁 {novel.total_views}</span>
          <span style={s.cardStat}>❤️ {novel.total_likes}</span>
          <span style={s.cardStat}>📚 {novel.total_chapters}</span>
          <span style={s.readMore}>পড়ো →</span>
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div style={s.skeleton}>
      <div style={{ height: 180, background: '#f1f3f4' }} />
      <div style={{ padding: 14 }}>
        {[60, 85, 40, 100, 80].map((w, i) => (
          <div key={i} style={{ width: `${w}%`, height: i === 2 ? 12 : i === 0 ? 12 : 14, background: '#f1f3f4', borderRadius: 4, marginTop: i === 0 ? 0 : 8 }} />
        ))}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#f8f9fa' },
  header: { background: '#fff', borderBottom: '1px solid #e8eaed', padding: '1.25rem 0' },
  headerInner: { maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: 600, color: '#11181c', margin: 0 },
  headerSub: { fontSize: 13, color: '#687076', margin: '3px 0 0' },
  searchForm: {},
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 10, fontSize: 14 },
  searchInput: { padding: '8px 32px 8px 32px', borderRadius: 8, border: '1px solid #e8eaed', fontSize: 14, outline: 'none', background: '#f8f9fa', width: 240, color: '#11181c' },
  clearBtn: { position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#687076', fontSize: 12 },
  body: { maxWidth: 1200, margin: '0 auto', padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' },
  sidebar: { width: 190, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 76 },
  filterBlock: { background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', padding: 14 },
  filterLabel: { fontSize: 11, fontWeight: 600, color: '#687076', textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 8px' },
  filterBtn: { display: 'flex', alignItems: 'center', width: '100%', padding: '7px 8px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#11181c', textAlign: 'left' },
  filterBtnActive: { display: 'flex', alignItems: 'center', width: '100%', padding: '7px 8px', borderRadius: 6, border: 'none', background: '#eef2ff', cursor: 'pointer', fontSize: 13, color: '#3451b2', fontWeight: 500, textAlign: 'left' },
  main: { flex: 1, minWidth: 0 },
  activeFilters: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: '#eef2ff', color: '#3451b2', fontSize: 12 },
  chipX: { background: 'none', border: 'none', cursor: 'pointer', color: '#3451b2', fontSize: 11, padding: 0 },
  clearAll: { fontSize: 12, color: '#687076', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 },
  card: { display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #e8eaed', cursor: 'pointer' },
  cardCover: { position: 'relative', height: 175, background: '#f1f3f4' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f1f3f4, #e8eaed)' },
  featuredDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: '#f5a623', boxShadow: '0 0 0 3px rgba(245,166,35,.25)' },
  cardInfo: { padding: 14, display: 'flex', flexDirection: 'column', flex: 1 },
  cardBadges: { display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 },
  genreTag: { fontSize: 11, padding: '2px 7px', borderRadius: 20, background: '#f1f3f4', color: '#687076', fontWeight: 500 },
  ongoingTag: { fontSize: 11, padding: '2px 7px', borderRadius: 20, background: '#e8f5e9', color: '#2e7d32', fontWeight: 500 },
  completedTag: { fontSize: 11, padding: '2px 7px', borderRadius: 20, background: '#e3f2fd', color: '#1565c0', fontWeight: 500 },
  premiumTag: { fontSize: 11, padding: '2px 7px', borderRadius: 20, background: '#fce4ec', color: '#c62828', fontWeight: 500 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#11181c', marginBottom: 3, lineHeight: 1.35 },
  cardAuthor: { fontSize: 12, color: '#687076', marginBottom: 6 },
  cardDesc: { fontSize: 12, color: '#687076', lineHeight: 1.55, flex: 1, marginBottom: 10 },
  cardFooter: { display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10, borderTop: '1px solid #f1f3f4' },
  cardStat: { fontSize: 12, color: '#687076' },
  readMore: { marginLeft: 'auto', fontSize: 12, color: '#3451b2', fontWeight: 500 },
  skeleton: { background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #e8eaed' },
  empty: { textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: 10, border: '1px solid #e8eaed' },
  emptyBtn: { padding: '9px 20px', borderRadius: 8, background: '#11181c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: '2rem' },
  pageBtn: { padding: '8px 14px', borderRadius: 7, border: '1px solid #e8eaed', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#11181c' },
  pageActive: { padding: '8px 14px', borderRadius: 7, border: 'none', background: '#11181c', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 },
  pageDisabled: { padding: '8px 14px', borderRadius: 7, border: '1px solid #e8eaed', background: '#f8f9fa', cursor: 'not-allowed', fontSize: 13, color: '#c0c8d0' },
}
