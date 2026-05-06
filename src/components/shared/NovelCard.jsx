import { Link } from 'react-router-dom'

export default function NovelCard({ novel }) {
  const writerName = novel.profiles?.username || 'লেখক'

  return (
    <Link to={`/novel/${novel.slug}`} style={styles.card}>
      <div style={styles.cover}>
        {novel.cover_url
          ? <img src={novel.cover_url} alt={novel.title} style={styles.img} />
          : <div style={styles.placeholder}>📖</div>
        }
        {!novel.is_free && <span style={styles.paidBadge}>প্রিমিয়াম</span>}
        {novel.is_featured && <span style={styles.featuredBadge}>⭐ ফিচার্ড</span>}
      </div>
      <div style={styles.info}>
        <h3 style={styles.title}>{novel.title}</h3>
        <p style={styles.writer}>✍️ {writerName}</p>
        <p style={styles.desc}>{novel.description?.slice(0, 80)}...</p>
        <div style={styles.meta}>
          <span style={styles.tag}>{novel.genre}</span>
          <span style={styles.stats}>👁 {novel.total_views} · 📚 {novel.total_chapters} ch</span>
        </div>
      </div>
    </Link>
  )
}

const styles = {
  card: {
    display: 'block', textDecoration: 'none', color: 'inherit',
    background: '#fff', borderRadius: 12, overflow: 'hidden',
    border: '1px solid #e8e8e8', cursor: 'pointer'
  },
  cover: { position: 'relative', height: 200, background: '#f0f0f0' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: {
    width: '100%', height: '100%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 48, background: '#f5f5f0'
  },
  paidBadge: {
    position: 'absolute', top: 8, right: 8,
    background: '#e94560', color: '#fff',
    fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600
  },
  featuredBadge: {
    position: 'absolute', top: 8, left: 8,
    background: '#f5a623', color: '#fff',
    fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600
  },
  info: { padding: '12px 14px' },
  title: { fontSize: 15, fontWeight: 600, color: '#1a1a2e', marginBottom: 4, lineHeight: 1.3 },
  writer: { fontSize: 12, color: '#888', marginBottom: 6 },
  desc: { fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 8 },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tag: {
    fontSize: 11, padding: '2px 8px', borderRadius: 20,
    background: '#f0f0ff', color: '#4a4af0', fontWeight: 500
  },
  stats: { fontSize: 11, color: '#aaa' }
}
