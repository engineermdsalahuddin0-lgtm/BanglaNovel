import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/shared/Navbar'
import ImageUpload from '../components/shared/ImageUpload'
import StickerPicker from '../components/shared/StickerPicker'
import { awardChapterPoints } from '../lib/points'


export default function WriterDash() {
  const { user, profile, isWriter } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [novels, setNovels] = useState([])
  const [tips, setTips] = useState([])
  const [stats, setStats] = useState({ totalViews: 0, totalLikes: 0, totalChapters: 0, totalTips: 0 })
  const [loading, setLoading] = useState(true)

  // Novel form
  const [showNovelForm, setShowNovelForm] = useState(false)
  const [editingNovel, setEditingNovel] = useState(null)
  const [novelForm, setNovelForm] = useState({ title: '', description: '', genre: 'fantasy', is_free: true, cover_url: '' })
  const [novelSaving, setNovelSaving] = useState(false)

  // Chapter form
  const [showChapterForm, setShowChapterForm] = useState(false)
  const [editingChapter, setEditingChapter] = useState(null)
  const [chapterForm, setChapterForm] = useState({ novel_id: '', title: '', content: '', is_free: true })
  const [chapterSaving, setChapterSaving] = useState(false)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { type: 'novel'|'chapter', id, title }

  useEffect(() => {
    if (!isWriter) { navigate('/'); return }
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: novelsData } = await supabase
      .from('novels').select('*').eq('writer_id', user.id).order('created_at', { ascending: false })
    const { data: tipsData } = await supabase
      .from('tips').select('*, profiles!tips_from_user_id_fkey(username)')
      .eq('to_writer_id', user.id).order('created_at', { ascending: false }).limit(20)

    const totalViews = novelsData?.reduce((a, n) => a + (n.total_views || 0), 0) || 0
    const totalLikes = novelsData?.reduce((a, n) => a + (n.total_likes || 0), 0) || 0
    const totalChapters = novelsData?.reduce((a, n) => a + (n.total_chapters || 0), 0) || 0
    const totalTips = tipsData?.reduce((a, t) => a + (t.writer_gets || 0), 0) || 0

    setNovels(novelsData || [])
    setTips(tipsData || [])
    setStats({ totalViews, totalLikes, totalChapters, totalTips })
    setLoading(false)
  }

  function makeSlug(title) {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0980-\u09FF-]/g, '').slice(0, 60) + '-' + Date.now().toString(36)
  }

  function openNovelForm(novel = null) {
    if (novel) {
      setEditingNovel(novel)
      setNovelForm({ title: novel.title, description: novel.description || '', genre: novel.genre, is_free: novel.is_free, cover_url: novel.cover_url || '' })
    } else {
      setEditingNovel(null)
      setNovelForm({ title: '', description: '', genre: 'fantasy', is_free: true, cover_url: '' })
    }
    setShowNovelForm(true)
    setTab('novels')
  }

  async function saveNovel() {
    if (!novelForm.title.trim()) return
    setNovelSaving(true)

    if (editingNovel) {
      await supabase.from('novels').update({
        title: novelForm.title,
        description: novelForm.description,
        genre: novelForm.genre,
        is_free: novelForm.is_free,
        cover_url: novelForm.cover_url || null,
        updated_at: new Date().toISOString(),
      }).eq('id', editingNovel.id)
    } else {
      await supabase.from('novels').insert({
        writer_id: user.id,
        title: novelForm.title,
        slug: makeSlug(novelForm.title),
        description: novelForm.description,
        genre: novelForm.genre,
        is_free: novelForm.is_free,
        cover_url: novelForm.cover_url,
      })
    }

    setShowNovelForm(false)
    setEditingNovel(null)
    setNovelForm({ title: '', description: '', genre: 'fantasy', is_free: true, cover_url: '' })
    fetchData()
    setNovelSaving(false)
  }

  async function deleteNovel(id) {
    await supabase.from('novels').delete().eq('id', id)
    setDeleteConfirm(null)
    fetchData()
  }

  async function toggleNovelStatus(novel) {
    await supabase.from('novels').update({ status: novel.status === 'ongoing' ? 'completed' : 'ongoing' }).eq('id', novel.id)
    fetchData()
  }

  function openChapterForm(chapter = null, novelId = '') {
    if (chapter) {
      setEditingChapter(chapter)
      setChapterForm({ novel_id: chapter.novel_id, title: chapter.title, content: chapter.content, is_free: chapter.is_free })
    } else {
      setEditingChapter(null)
      setChapterForm({ novel_id: novelId || (novels[0]?.id || ''), title: '', content: '', is_free: true })
    }
    setShowChapterForm(true)
    setTab('chapters')
  }

  async function saveChapter() {
    if (!chapterForm.novel_id || !chapterForm.title.trim() || !chapterForm.content.trim()) return
    setChapterSaving(true)

    // saveChapter function এ, insert এর পরে:
    if (data?.id) {
      await awardChapterPoints(
        user.id,
        data.id,
        chapterForm.content.trim().split(/\s+/).length
      )
    }

    if (editingChapter) {
      await supabase.from('chapters').update({
        title: chapterForm.title,
        content: chapterForm.content,
        is_free: chapterForm.is_free,
        word_count: chapterForm.content.trim().split(/\s+/).length,
      }).eq('id', editingChapter.id)
    } else {
      // const { count } = await supabase.from('chapters').select('*', { count: 'exact', head: true }).eq('novel_id', chapterForm.novel_id)
      // await supabase.from('chapters').insert({
      //   novel_id: chapterForm.novel_id,
      //   chapter_number: (count || 0) + 1,
      //   title: chapterForm.title,
      //   content: chapterForm.content,
      //   is_free: chapterForm.is_free,
      //   word_count: chapterForm.content.trim().split(/\s+/).length,
      // })


      const { data: newChapter } = await supabase.from('chapters').insert({
        novel_id: chapterForm.novel_id,
        chapter_number: (count || 0) + 1,
        title: chapterForm.title,
        content: chapterForm.content,
        is_free: chapterForm.is_free,
        word_count: chapterForm.content.trim().split(/\s+/).length,
      }).select().single()

      // Points দাও
      if (newChapter?.id) {
        await awardChapterPoints(
          user.id,
          newChapter.id,
          chapterForm.content.trim().split(/\s+/).length
        )
      }
    }

    setShowChapterForm(false)
    setEditingChapter(null)
    setChapterForm({ novel_id: '', title: '', content: '', is_free: true })
    fetchData()
    setChapterSaving(false)
  }

  

  if (loading) return <><Navbar /><div style={s.loading}>লোড হচ্ছে...</div></>

  return (
    <div style={s.page}>
      <Navbar />

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>⚠️ মুছে ফেলবে?</h3>
            <p style={s.modalDesc}>
              <strong>"{deleteConfirm.title}"</strong> মুছে ফেললে আর ফেরত পাবে না।
              {deleteConfirm.type === 'novel' && ' এর সব chapter ও মুছে যাবে।'}
            </p>
            <div style={s.modalActions}>
              <button onClick={() => setDeleteConfirm(null)} style={s.cancelBtn}>বাতিল</button>
              <button
                onClick={() => deleteConfirm.type === 'novel' ? deleteNovel(deleteConfirm.id) : deleteChapter(deleteConfirm.id)}
                style={s.deleteConfirmBtn}
              >
                হ্যাঁ, মুছে দাও
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div>
            <h1 style={s.headerTitle}>লেখক ড্যাশবোর্ড</h1>
            <p style={s.headerSub}>স্বাগতম, {profile?.username} 👋</p>
          </div>
          <div style={s.headerActions}>
            <button onClick={() => openNovelForm()} style={s.primaryBtn}>+ নতুন বই</button>
            <button onClick={() => openChapterForm()} style={s.secondaryBtn}>+ নতুন অধ্যায়</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabBar}>
        <div style={s.tabInner}>
          {[
            { key: 'overview', label: '📊 ওভারভিউ' },
            { key: 'novels', label: '📚 বই' },
            { key: 'chapters', label: '📝 অধ্যায়' },
            { key: 'earnings', label: '💰 আয়' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={tab === t.key ? s.tabActive : s.tab}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={s.content}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={s.statsGrid}>
              <StatCard icon="👁" label="মোট ভিউ" value={stats.totalViews.toLocaleString()} />
              <StatCard icon="❤️" label="মোট লাইক" value={stats.totalLikes.toLocaleString()} />
              <StatCard icon="📚" label="মোট অধ্যায়" value={stats.totalChapters} />
              <StatCard icon="💰" label="মোট আয়" value={`৳${stats.totalTips.toFixed(0)}`} />
            </div>
            <div style={s.twoCol}>
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <h3 style={s.cardTitle}>সাম্প্রতিক বই</h3>
                  <button onClick={() => setTab('novels')} style={s.linkBtn}>সব দেখো →</button>
                </div>
                {novels.slice(0, 4).map(novel => (
                  <div key={novel.id} style={s.listRow}>
                    <div style={{ flex: 1 }}>
                      <p style={s.rowTitle}>{novel.title}</p>
                      <p style={s.rowSub}>{novel.total_chapters} অধ্যায় · {novel.total_views} ভিউ</p>
                    </div>
                    <span style={novel.status === 'completed' ? s.tagComplete : s.tagOngoing}>
                      {novel.status === 'completed' ? 'সম্পূর্ণ' : 'চলমান'}
                    </span>
                  </div>
                ))}
                {novels.length === 0 && <p style={s.emptyMsg}>এখনো কোনো বই নেই।</p>}
              </div>
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <h3 style={s.cardTitle}>সাম্প্রতিক টিপস</h3>
                  <button onClick={() => setTab('earnings')} style={s.linkBtn}>সব দেখো →</button>
                </div>
                {tips.slice(0, 4).map(tip => (
                  <div key={tip.id} style={s.listRow}>
                    <div style={{ flex: 1 }}>
                      <p style={s.rowTitle}>{tip.profiles?.username || 'পাঠক'}</p>
                      <p style={s.rowSub}>{tip.message || 'কোনো বার্তা নেই'}</p>
                    </div>
                    <span style={s.tipAmount}>৳{tip.writer_gets}</span>
                  </div>
                ))}
                {tips.length === 0 && <p style={s.emptyMsg}>এখনো কোনো টিপস নেই।</p>}
              </div>
            </div>
          </div>
        )}

        {/* NOVELS TAB */}
        {tab === 'novels' && (
          <div>
            {showNovelForm && (
              <div style={s.formCard}>
                <h3 style={s.formTitle}>{editingNovel ? '✏️ বই সম্পাদনা' : '📚 নতুন বই যোগ করো'}</h3>
                <div style={s.formGrid}>
                  <div style={s.formGroup}>
                    <label style={s.label}>বইয়ের নাম *</label>
                    <input style={s.input} placeholder="বইয়ের নাম লেখো"
                      value={novelForm.title} onChange={e => setNovelForm(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>ঘরানা</label>
                    <select style={s.input} value={novelForm.genre}
                      onChange={e => setNovelForm(p => ({ ...p, genre: e.target.value }))}>
                      <option value="fantasy">⚔️ ফ্যান্টাসি</option>
                      <option value="romance">💕 রোমান্স</option>
                      <option value="thriller">🔍 থ্রিলার</option>
                      <option value="horror">👻 হরর</option>
                      <option value="other">📚 অন্যান্য</option>
                    </select>
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>বিবরণ</label>
                  <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
                    placeholder="বইটি সম্পর্কে লেখো..."
                    value={novelForm.description}
                    onChange={e => setNovelForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>বইয়ের কভার</label>
                  <ImageUpload
                    bucket="covers"
                    currentUrl={novelForm.cover_url}
                    onUpload={(url) => setNovelForm(p => ({ ...p, cover_url: url }))}
                    height={280}
                    placeholder="বইয়ের কভার আপলোড করো"
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.checkRow}>
                    <input type="checkbox" checked={novelForm.is_free}
                      onChange={e => setNovelForm(p => ({ ...p, is_free: e.target.checked }))} />
                    <span style={s.label}>ফ্রি বই</span>
                  </label>
                </div>
                <div style={s.formActions}>
                  <button onClick={() => { setShowNovelForm(false); setEditingNovel(null) }} style={s.cancelBtn}>বাতিল</button>
                  <button onClick={saveNovel} disabled={novelSaving} style={s.primaryBtn}>
                    {novelSaving ? 'সেভ হচ্ছে...' : editingNovel ? 'আপডেট করো' : 'বই প্রকাশ করো'}
                  </button>
                </div>
              </div>
            )}

            <div style={s.novelGrid}>
              {novels.map(novel => (
                <div key={novel.id} style={s.novelCard}>
                  {/* Cover */}
                  <div style={s.novelCover}>
                    {novel.cover_url
                      ? <img src={novel.cover_url} alt={novel.title} style={s.novelCoverImg} />
                      : <div style={s.novelCoverPlaceholder}><span style={s.novelCoverLetter}>{novel.title[0]}</span></div>
                    }
                    <span style={novel.status === 'completed' ? s.tagComplete : s.tagOngoing}>
                      {novel.status === 'completed' ? 'সম্পূর্ণ' : 'চলমান'}
                    </span>
                  </div>
                  {/* Info */}
                  <div style={s.novelCardInfo}>
                    <Link to={`/novel/${novel.slug}`} style={s.novelCardTitle}>{novel.title}</Link>
                    <p style={s.novelCardMeta}>{novel.genre} · {novel.total_chapters} অধ্যায় · {novel.total_views} ভিউ</p>
                    <div style={s.novelCardActions}>
                      <button onClick={() => openChapterForm(null, novel.id)} style={s.actionBtn}>+ অধ্যায়</button>
                      <button onClick={() => openNovelForm(novel)} style={s.actionBtn}>✏️ Edit</button>
                      <button onClick={() => toggleNovelStatus(novel)} style={s.actionBtn}>
                        {novel.status === 'ongoing' ? '✅ সম্পূর্ণ' : '🔄 চালু'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'novel', id: novel.id, title: novel.title })}
                        style={s.deleteBtn}
                      >🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {novels.length === 0 && (
              <div style={s.tableEmpty}>
                <p>এখনো কোনো বই নেই।</p>
                <button onClick={() => openNovelForm()} style={s.primaryBtn}>+ প্রথম বই লেখো</button>
              </div>
            )}
          </div>
        )}

        {/* CHAPTERS TAB */}
        {tab === 'chapters' && (
          <div>
            {showChapterForm && (
              <div style={s.formCard}>
                <h3 style={s.formTitle}>{editingChapter ? '✏️ অধ্যায় সম্পাদনা' : '📝 নতুন অধ্যায় লেখো'}</h3>
                {!editingChapter && (
                  <div style={s.formGroup}>
                    <label style={s.label}>কোন বইয়ে যোগ করবে *</label>
                    <select style={s.input} value={chapterForm.novel_id}
                      onChange={e => setChapterForm(p => ({ ...p, novel_id: e.target.value }))}>
                      <option value="">বই বেছে নাও</option>
                      {novels.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                    </select>
                  </div>
                )}
                <div style={s.formGroup}>
                  <label style={s.label}>অধ্যায়ের শিরোনাম *</label>
                  <input style={s.input} placeholder="অধ্যায়ের নাম"
                    value={chapterForm.title}
                    onChange={e => setChapterForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>লেখা *</label>
                  <textarea
                    style={{ ...s.input, minHeight: 320, resize: 'vertical', fontFamily: "'Noto Serif Bengali', Georgia, serif", fontSize: 15, lineHeight: 1.9 }}
                    placeholder="এখানে অধ্যায়ের গল্প লেখো..."
                    value={chapterForm.content}
                    onChange={e => setChapterForm(p => ({ ...p, content: e.target.value }))}
                  />
                  <p style={s.wordCount}>
                    {chapterForm.content.trim() ? chapterForm.content.trim().split(/\s+/).length : 0} শব্দ
                  </p>
                </div>
                {/* Image + Sticker */}
                <div style={s.formGroup}>
                  <label style={s.label}>ছবি / Sticker যোগ করো</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <ImageUpload
                      bucket="chapters"
                      onUpload={(url) => setChapterForm(p => ({ ...p, content: p.content + `\n\n[image:${url}]\n\n` }))}
                      height={80}
                      width="180px"
                      placeholder="ছবি যোগ করো"
                      showPreview={false}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 12, color: '#7a7267' }}>Sticker:</span>
                      <StickerPicker
                        onSelect={(sticker) => setChapterForm(p => ({ ...p, content: p.content + ` ${sticker.emoji} ` }))}
                        onImageUpload={(url) => setChapterForm(p => ({ ...p, content: p.content + `\n\n[image:${url}]\n\n` }))}
                      />
                    </div>
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.checkRow}>
                    <input type="checkbox" checked={chapterForm.is_free}
                      onChange={e => setChapterForm(p => ({ ...p, is_free: e.target.checked }))} />
                    <span style={s.label}>ফ্রি অধ্যায়</span>
                  </label>
                </div>
                <div style={s.formActions}>
                  <button onClick={() => { setShowChapterForm(false); setEditingChapter(null) }} style={s.cancelBtn}>বাতিল</button>
                  <button onClick={saveChapter} disabled={chapterSaving} style={s.primaryBtn}>
                    {chapterSaving ? 'সেভ হচ্ছে...' : editingChapter ? 'আপডেট করো' : 'অধ্যায় প্রকাশ করো'}
                  </button>
                </div>
              </div>
            )}

            {novels.map(novel => (
              <NovelChapterSection
                key={novel.id}
                novel={novel}
                onEdit={(chapter) => openChapterForm(chapter)}
                onDelete={(id, title) => setDeleteConfirm({ type: 'chapter', id, title })}
                onRefresh={fetchData}
              />
            ))}
            {novels.length === 0 && (
              <div style={s.tableEmpty}>
                <p>আগে একটি বই তৈরি করো।</p>
                <button onClick={() => setTab('novels')} style={s.primaryBtn}>বই তৈরি করো</button>
              </div>
            )}
          </div>
        )}

        {/* EARNINGS TAB */}
        {tab === 'earnings' && (
          <div>
            <div style={s.statsGrid}>
              <StatCard icon="💰" label="মোট আয়" value={`৳${stats.totalTips.toFixed(0)}`} />
              <StatCard icon="🎁" label="মোট টিপস" value={tips.length} />
              <StatCard icon="📈" label="এই মাসে" value={`৳${tips.filter(t => new Date(t.created_at) > new Date(Date.now() - 30*24*60*60*1000)).reduce((a,t) => a+t.writer_gets, 0).toFixed(0)}`} />
              <StatCard icon="⭐" label="সর্বোচ্চ টিপ" value={`৳${Math.max(0, ...tips.map(t => t.writer_gets)).toFixed(0)}`} />
            </div>
            <div style={s.card}>
              <h3 style={s.cardTitle}>টিপস ইতিহাস</h3>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>{['পাঠক','পরিমাণ','তোমার আয়','বার্তা','তারিখ'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {tips.map(tip => (
                      <tr key={tip.id} style={s.tr}>
                        <td style={s.td}>{tip.profiles?.username || 'পাঠক'}</td>
                        <td style={s.td}>৳{tip.amount}</td>
                        <td style={s.td}><strong style={{ color: '#2e7d32' }}>৳{tip.writer_gets}</strong></td>
                        <td style={s.td}>{tip.message || '—'}</td>
                        <td style={s.td}>{new Date(tip.created_at).toLocaleDateString('bn-BD')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tips.length === 0 && <div style={s.tableEmpty}><p>এখনো কোনো টিপস পাওনি।</p></div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NovelChapterSection({ novel, onEdit, onDelete, onRefresh }) {
  const [chapters, setChapters] = useState([])
  const [open, setOpen] = useState(false)

  async function load() {
    if (open) { setOpen(false); return }
    const { data } = await supabase.from('chapters').select('*').eq('novel_id', novel.id).order('chapter_number', { ascending: true })
    setChapters(data || [])
    setOpen(true)
  }

  async function deleteChapter(id) {
    await supabase.from('chapters').delete().eq('id', id)
    setChapters(prev => prev.filter(c => c.id !== id))
    onRefresh()
  }

  return (
    <div style={s.novelSection}>
      <button onClick={load} style={s.novelSectionHeader}>
        <span style={{ fontWeight: 600, color: '#11181c' }}>{novel.title}</span>
        <span style={{ fontSize: 13, color: '#687076' }}>{novel.total_chapters} অধ্যায় {open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>{['#','শিরোনাম','শব্দ','ধরন','Action'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {chapters.map(ch => (
                <tr key={ch.id} style={s.tr}>
                  <td style={s.td}>{ch.chapter_number}</td>
                  <td style={s.td}>{ch.title}</td>
                  <td style={s.td}>{ch.word_count}</td>
                  <td style={s.td}><span style={ch.is_free ? s.tagFree : s.tagPaid}>{ch.is_free ? 'ফ্রি' : 'পেইড'}</span></td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => onEdit(ch)} style={s.editBtn}>✏️ Edit</button>
                      <button onClick={() => onDelete(ch.id, ch.title)} style={s.deleteBtn}>🗑️ মুছো</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {chapters.length === 0 && <div style={s.tableEmpty}><p>এই বইয়ে এখনো অধ্যায় নেই।</p></div>}
        </div>
      )}
    </div>
  )
}

async function deleteChapter(id) {
  await supabase.from('chapters').delete().eq('id', id)
}

function StatCard({ icon, label, value }) {
  return (
    <div style={s.statCard}>
      <div style={s.statIcon}>{icon}</div>
      <div>
        <p style={s.statLabel}>{label}</p>
        <p style={s.statValue}>{value}</p>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#f8f9fa' },
  loading: { padding: '4rem', textAlign: 'center', color: '#888' },
  header: { background: '#fff', borderBottom: '1px solid #e8eaed', padding: '1.25rem 0' },
  headerInner: { maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: 600, color: '#11181c', margin: 0 },
  headerSub: { fontSize: 13, color: '#687076', margin: '3px 0 0' },
  headerActions: { display: 'flex', gap: 8 },

  // Modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { background: '#fff', borderRadius: 12, padding: '2rem', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.2)' },
  modalTitle: { fontSize: 18, fontWeight: 600, color: '#11181c', marginBottom: 12 },
  modalDesc: { fontSize: 14, color: '#687076', lineHeight: 1.6, marginBottom: '1.5rem' },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },

  tabBar: { background: '#fff', borderBottom: '1px solid #e8eaed' },
  tabInner: { maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', display: 'flex' },
  tab: { padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#687076', borderBottom: '2px solid transparent' },
  tabActive: { padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#11181c', fontWeight: 500, borderBottom: '2px solid #11181c' },
  content: { maxWidth: 1100, margin: '0 auto', padding: '1.5rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: '1.5rem' },
  statCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14 },
  statIcon: { fontSize: 28 },
  statLabel: { fontSize: 12, color: '#687076', margin: 0 },
  statValue: { fontSize: 22, fontWeight: 600, color: '#11181c', margin: '2px 0 0' },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 },
  card: { background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', padding: '1.25rem', marginBottom: 12 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#11181c', margin: '0 0 1rem' },
  linkBtn: { fontSize: 12, color: '#3451b2', background: 'none', border: 'none', cursor: 'pointer' },
  listRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f3f4' },
  rowTitle: { fontSize: 13, fontWeight: 500, color: '#11181c', margin: 0 },
  rowSub: { fontSize: 12, color: '#687076', margin: '2px 0 0' },
  tipAmount: { fontSize: 14, fontWeight: 600, color: '#2e7d32' },
  emptyMsg: { fontSize: 13, color: '#687076', textAlign: 'center', padding: '1.5rem 0' },

  // Novel grid cards
  novelGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 },
  novelCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', overflow: 'hidden' },
  novelCover: { position: 'relative', height: 200 },
  novelCoverImg: { width: '100%', height: '100%', objectFit: 'cover' },
  novelCoverPlaceholder: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a2744, #2d4080)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  novelCoverLetter: { fontFamily: "'Playfair Display', serif", fontSize: 64, fontWeight: 900, color: 'rgba(255,255,255,0.15)' },
  novelCardInfo: { padding: '12px' },
  novelCardTitle: { fontSize: 14, fontWeight: 600, color: '#11181c', textDecoration: 'none', display: 'block', marginBottom: 4 },
  novelCardMeta: { fontSize: 12, color: '#687076', marginBottom: 10 },
  novelCardActions: { display: 'flex', gap: 6, flexWrap: 'wrap' },

  formCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', padding: '1.5rem', marginBottom: '1.5rem' },
  formTitle: { fontSize: 16, fontWeight: 600, color: '#11181c', marginBottom: '1.25rem' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  formGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: 500, color: '#11181c', marginBottom: 6, display: 'block' },
  input: { width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #e8eaed', fontSize: 13, outline: 'none', color: '#11181c', background: '#fff', boxSizing: 'border-box' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  wordCount: { fontSize: 11, color: '#687076', marginTop: 4, textAlign: 'right' },
  formActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 },

  primaryBtn: { padding: '8px 18px', borderRadius: 7, background: '#11181c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  secondaryBtn: { padding: '8px 18px', borderRadius: 7, background: '#fff', color: '#11181c', border: '1px solid #e8eaed', cursor: 'pointer', fontSize: 13 },
  cancelBtn: { padding: '8px 18px', borderRadius: 7, background: '#fff', color: '#687076', border: '1px solid #e8eaed', cursor: 'pointer', fontSize: 13 },
  actionBtn: { padding: '5px 10px', borderRadius: 6, border: '1px solid #e8eaed', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#11181c' },
  editBtn: { padding: '5px 10px', borderRadius: 6, border: '1px solid #e8eaed', background: '#eef2ff', cursor: 'pointer', fontSize: 12, color: '#3451b2' },
  deleteBtn: { padding: '5px 10px', borderRadius: 6, border: 'none', background: '#fce4ec', cursor: 'pointer', fontSize: 12, color: '#c62828' },
  deleteConfirmBtn: { padding: '8px 18px', borderRadius: 7, background: '#c62828', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 },

  novelSection: { background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', marginBottom: 10, overflow: 'hidden' },
  novelSectionHeader: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f3f4' },

  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#687076', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid #e8eaed', textAlign: 'left', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f1f3f4' },
  td: { padding: '12px 12px', fontSize: 13, color: '#11181c', verticalAlign: 'middle' },
  tableEmpty: { textAlign: 'center', padding: '3rem', color: '#687076' },

  tagOngoing: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#e8f5e9', color: '#2e7d32', fontWeight: 500, position: 'absolute', top: 8, right: 8 },
  tagComplete: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#e3f2fd', color: '#1565c0', fontWeight: 500, position: 'absolute', top: 8, right: 8 },
  tagFree: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#e8f5e9', color: '#2e7d32' },
  tagPaid: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#fce4ec', color: '#c62828' },
}
