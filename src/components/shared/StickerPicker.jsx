import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const BUILT_IN_STICKERS = [
  { id: 'heart', emoji: '❤️', label: 'ভালোবাসা' },
  { id: 'fire', emoji: '🔥', label: 'দারুণ' },
  { id: 'cry', emoji: '😭', label: 'কান্না' },
  { id: 'laugh', emoji: '😂', label: 'হাসি' },
  { id: 'wow', emoji: '😮', label: 'বিস্ময়' },
  { id: 'clap', emoji: '👏', label: 'সাধুবাদ' },
  { id: 'star', emoji: '⭐', label: 'পছন্দ' },
  { id: 'think', emoji: '🤔', label: 'ভাবছি' },
  { id: 'sad', emoji: '😢', label: 'দুঃখ' },
  { id: 'angry', emoji: '😠', label: 'রাগ' },
  { id: 'love_eyes', emoji: '😍', label: 'প্রেম' },
  { id: 'scream', emoji: '😱', label: 'ভয়' },
]

export default function StickerPicker({ onSelect, onImageUpload }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('stickers') // 'stickers' | 'upload'
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  async function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('stickers')
      .upload(path, file, { upsert: true })

    if (!error) {
      const { data } = supabase.storage.from('stickers').getPublicUrl(path)
      onImageUpload?.(data.publicUrl)
      setOpen(false)
    }
    setUploading(false)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={s.triggerBtn}
        title="Sticker যোগ করো"
      >
        🎭
      </button>

      {open && (
        <div style={s.picker}>
          {/* Tabs */}
          <div style={s.tabs}>
            <button type="button" onClick={() => setTab('stickers')} style={tab === 'stickers' ? s.tabActive : s.tab}>Stickers</button>
            <button type="button" onClick={() => setTab('upload')} style={tab === 'upload' ? s.tabActive : s.tab}>ছবি আপলোড</button>
            <button type="button" onClick={() => setOpen(false)} style={s.closeBtn}>✕</button>
          </div>

          {tab === 'stickers' && (
            <div style={s.stickerGrid}>
              {BUILT_IN_STICKERS.map(sticker => (
                <button
                  key={sticker.id}
                  type="button"
                  title={sticker.label}
                  onClick={() => { onSelect?.(sticker); setOpen(false) }}
                  style={s.stickerBtn}
                >
                  <span style={s.stickerEmoji}>{sticker.emoji}</span>
                  <span style={s.stickerLabel}>{sticker.label}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'upload' && (
            <div style={s.uploadTab}>
              <p style={s.uploadHint}>নিজের sticker বা ছবি upload করো</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                style={s.uploadBtn}
                disabled={uploading}
              >
                {uploading ? 'আপলোড হচ্ছে...' : '📁 ফাইল বেছে নাও'}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleImageUpload(e.target.files[0])}
              />
              <p style={s.uploadNote}>PNG, JPG, GIF, WebP · max 2MB</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  triggerBtn: { background: 'none', border: '1px solid #d4cfc4', borderRadius: 6, cursor: 'pointer', padding: '6px 10px', fontSize: 16, lineHeight: 1 },
  picker: { position: 'absolute', bottom: '100%', left: 0, marginBottom: 8, background: '#fff', border: '1px solid #d4cfc4', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.12)', width: 260, zIndex: 100 },
  tabs: { display: 'flex', alignItems: 'center', borderBottom: '1px solid #ede9e0', padding: '6px 6px 0' },
  tab: { flex: 1, padding: '6px 4px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: '#7a7267', borderBottom: '2px solid transparent' },
  tabActive: { flex: 1, padding: '6px 4px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: '#1a2744', fontWeight: 600, borderBottom: '2px solid #1a2744' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#7a7267', fontSize: 14, padding: '4px 6px' },
  stickerGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, padding: 8 },
  stickerBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 4px', border: '1px solid transparent', borderRadius: 6, background: 'none', cursor: 'pointer', transition: 'background .1s' },
  stickerEmoji: { fontSize: 24 },
  stickerLabel: { fontSize: 9, color: '#7a7267' },
  uploadTab: { padding: '1rem', textAlign: 'center' },
  uploadHint: { fontSize: 13, color: '#1a2744', marginBottom: 12 },
  uploadBtn: { padding: '10px 20px', borderRadius: 6, background: '#1a2744', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 8 },
  uploadNote: { fontSize: 11, color: '#7a7267' },
}
