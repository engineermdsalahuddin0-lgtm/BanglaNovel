import { useState } from 'react'
import { createChapter, deleteChapter } from '../../lib/chapters'

export default function ChapterSidebar({
  novels,
  selectedNovelId,
  onSelectNovel,
  chapters,
  selectedChapterId,
  onSelectChapter,
  onChaptersChange,
  darkMode,
}) {
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const d = darkMode

  async function handleCreate() {
    if (!selectedNovelId) return
    setCreating(true)
    try {
      const chapter = await createChapter(selectedNovelId)
      onChaptersChange()
      onSelectChapter(chapter)
    } catch (err) {
      console.error(err)
      alert('অধ্যায় তৈরি করতে পারিনি।')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(e, chapter) {
    e.stopPropagation()
    if (!window.confirm(`"${chapter.title}" মুছে ফেলবেন?`)) return
    setDeletingId(chapter.id)
    try {
      await deleteChapter(chapter.id, selectedNovelId)
      if (selectedChapterId === chapter.id) onSelectChapter(null)
      onChaptersChange()
    } catch (err) {
      console.error(err)
      alert('মুছতে পারিনি।')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <aside style={{
      width: 260,
      minWidth: 260,
      height: '100vh',
      overflowY: 'auto',
      background: d ? '#111318' : '#fafafa',
      borderRight: `1px solid ${d ? '#1e2029' : '#e5e7eb'}`,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {/* Brand */}
      <div style={{
        padding: '20px 20px 14px',
        borderBottom: `1px solid ${d ? '#1e2029' : '#e5e7eb'}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: d ? '#6366f1' : '#4f46e5', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          ✍️ Novelist
        </div>
      </div>

      {/* Novel Selector */}
      <div style={{ padding: '14px 16px 0' }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: d ? '#6b7280' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '.1em', display: 'block', marginBottom: 6 }}>
          বই নির্বাচন
        </label>
        <select
          value={selectedNovelId || ''}
          onChange={e => onSelectNovel(e.target.value)}
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 8,
            border: `1px solid ${d ? '#2a2d3a' : '#e5e7eb'}`,
            background: d ? '#1a1d27' : '#fff',
            color: d ? '#e2e8f0' : '#111827',
            fontSize: 13, cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">— বই বেছে নিন —</option>
          {novels.map(n => (
            <option key={n.id} value={n.id}>{n.title}</option>
          ))}
        </select>
      </div>

      {/* Chapter List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {selectedNovelId && (
          <div style={{ padding: '0 12px 8px' }}>
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 8,
                border: `1px dashed ${d ? '#374151' : '#d1d5db'}`,
                background: 'transparent', cursor: 'pointer',
                color: d ? '#9ca3af' : '#6b7280', fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
            >
              {creating ? '…' : '+ নতুন অধ্যায়'}
            </button>
          </div>
        )}

        {chapters.length === 0 && selectedNovelId && (
          <p style={{ fontSize: 12, color: d ? '#4b5563' : '#9ca3af', textAlign: 'center', padding: '20px 16px' }}>
            এখনো কোনো অধ্যায় নেই
          </p>
        )}

        {chapters.map((ch) => {
          const active = ch.id === selectedChapterId
          return (
            <div
              key={ch.id}
              onClick={() => onSelectChapter(ch)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 16px', cursor: 'pointer',
                background: active
                  ? (d ? '#1e2230' : '#ede9fe')
                  : 'transparent',
                borderLeft: active
                  ? `3px solid ${d ? '#6366f1' : '#4f46e5'}`
                  : '3px solid transparent',
                transition: 'all 0.12s',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  color: active ? (d ? '#a5b4fc' : '#4f46e5') : (d ? '#cbd5e1' : '#374151'),
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {ch.chapter_number}. {ch.title}
                </div>
                <div style={{ fontSize: 10, color: d ? '#4b5563' : '#9ca3af', marginTop: 2 }}>
                  {(ch.word_count || 0).toLocaleString()} শব্দ
                  {' · '}
                  <span style={{ color: ch.is_free ? '#22c55e' : '#f59e0b' }}>
                    {ch.is_free ? 'ফ্রি' : 'পেইড'}
                  </span>
                </div>
              </div>
              <button
                onClick={e => handleDelete(e, ch)}
                disabled={deletingId === ch.id}
                title="মুছুন"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: d ? '#4b5563' : '#d1d5db', fontSize: 14,
                  padding: '2px 4px', borderRadius: 4,
                  opacity: 0, transition: 'opacity 0.15s',
                }}
                className="delete-chapter-btn"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
