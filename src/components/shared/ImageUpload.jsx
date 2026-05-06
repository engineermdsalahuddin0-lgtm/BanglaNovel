import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function ImageUpload({
  bucket,           // 'avatars' | 'covers' | 'chapters' | 'stickers' | 'comments'
  onUpload,         // callback(url) — upload হলে url দেবে
  currentUrl,       // আগের image url
  accept = 'image/*',
  maxSizeMB = 5,
  shape = 'rect',   // 'rect' | 'circle'
  width = '100%',
  height = 200,
  placeholder = 'ছবি আপলোড করো',
  showPreview = true,
}) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl || null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  async function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('শুধু image file দাও'); return }
    if (file.size > maxSizeMB * 1024 * 1024) { setError(`${maxSizeMB}MB এর বেশি দেওয়া যাবে না`); return }

    setError('')
    setUploading(true)

    // Preview
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(file)

    // Upload
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    onUpload(data.publicUrl)
    setUploading(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const isCircle = shape === 'circle'

  return (
    <div style={{ width, position: 'relative' }}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        style={{
          ...s.zone,
          height: isCircle ? width : height,
          borderRadius: isCircle ? '50%' : 8,
          borderColor: dragOver ? 'var(--accent, #c0392b)' : '#d4cfc4',
          background: dragOver ? 'rgba(192,57,43,0.04)' : preview ? 'transparent' : '#f7f4ef',
          cursor: uploading ? 'wait' : 'pointer',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {preview && showPreview ? (
          <>
            <img src={preview} alt="" style={s.preview} />
            <div style={s.overlay}>
              <span style={s.overlayText}>{uploading ? 'আপলোড হচ্ছে...' : '✏️ বদলাও'}</span>
            </div>
          </>
        ) : (
          <div style={s.empty}>
            {uploading ? (
              <div style={s.spinner} />
            ) : (
              <>
                <div style={s.uploadIcon}>📷</div>
                <p style={s.uploadText}>{placeholder}</p>
                <p style={s.uploadHint}>drag & drop বা click করো · max {maxSizeMB}MB</p>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p style={s.error}>{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  )
}

const s = {
  zone: { border: '2px dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' },
  preview: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s', ':hover': { background: 'rgba(0,0,0,0.4)' } },
  overlayText: { color: '#fff', fontSize: 13, fontWeight: 600, opacity: 0, background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: 20 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, textAlign: 'center' },
  uploadIcon: { fontSize: 32 },
  uploadText: { fontSize: 14, fontWeight: 500, color: '#1a2744', margin: 0 },
  uploadHint: { fontSize: 11, color: '#7a7267', margin: 0 },
  spinner: { width: 32, height: 32, border: '3px solid #e8e8e8', borderTop: '3px solid #c0392b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  error: { fontSize: 12, color: '#c0392b', marginTop: 6 },
}
