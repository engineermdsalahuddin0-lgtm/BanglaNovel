import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import ImageUpload from './ImageUpload'
import StickerPicker from './StickerPicker'

export default function CommentSection({ novelId }) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [imageUrl, setImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState(null) // { id, username }
  const [replyContent, setReplyContent] = useState('')
  const [replyImage, setReplyImage] = useState('')
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showReplyImageUpload, setShowReplyImageUpload] = useState(false)

  useEffect(() => { fetchComments() }, [novelId])

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('novel_id', novelId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
    setComments(data || [])
    setLoading(false)
  }

  async function submitComment() {
    if (!content.trim() && !imageUrl) return
    if (!user) return
    setSubmitting(true)

    const text = imageUrl ? `${content}\n[image:${imageUrl}]` : content

    await supabase.from('comments').insert({
      novel_id: novelId,
      user_id: user.id,
      content: text,
      rating: rating || null,
    })

    setContent('')
    setRating(0)
    setImageUrl('')
    setShowImageUpload(false)
    fetchComments()
    setSubmitting(false)
  }

  async function submitReply() {
    if (!replyContent.trim() && !replyImage) return
    if (!user) return

    const text = replyImage ? `${replyContent}\n[image:${replyImage}]` : replyContent

    await supabase.from('comments').insert({
      novel_id: novelId,
      user_id: user.id,
      content: text,
      parent_id: replyTo.id,
    })

    setReplyTo(null)
    setReplyContent('')
    setReplyImage('')
    setShowReplyImageUpload(false)
    fetchComments()
  }

  async function deleteComment(id) {
    await supabase.from('comments').delete().eq('id', id)
    fetchComments()
  }

  const avgRating = comments.filter(c => c.rating).length > 0
    ? (comments.filter(c => c.rating).reduce((a, c) => a + c.rating, 0) / comments.filter(c => c.rating).length).toFixed(1)
    : null

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h3 style={s.title}>মন্তব্য ও রিভিউ</h3>
          <p style={s.sub}>{comments.length}টি মন্তব্য {avgRating ? `· গড় রেটিং: ${avgRating}⭐` : ''}</p>
        </div>
      </div>

      {/* Write comment */}
      {user ? (
        <div style={s.writeBox}>
          <div style={s.writeAvatar}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} style={s.avatarImg} alt="" />
              : <span style={s.avatarLetter}>{profile?.username?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div style={s.writeRight}>
            {/* Star rating */}
            <div style={s.ratingRow}>
              <span style={s.ratingLabel}>রেটিং (optional):</span>
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(rating === star ? 0 : star)}
                  style={s.starBtn}
                >
                  <span style={{ fontSize: 20, color: star <= (hoverRating || rating) ? '#b8860b' : '#d4cfc4' }}>★</span>
                </button>
              ))}
              {rating > 0 && <span style={s.ratingVal}>{rating}/5</span>}
            </div>

            <textarea
              style={s.textarea}
              placeholder="তোমার মন্তব্য লেখো..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
            />

            {/* Image preview */}
            {imageUrl && (
              <div style={s.previewWrap}>
                <img src={imageUrl} alt="" style={s.previewImg} />
                <button type="button" onClick={() => setImageUrl('')} style={s.removeImg}>✕</button>
              </div>
            )}

            {/* Toolbar */}
            <div style={s.toolbar}>
              <div style={s.toolbarLeft}>
                <button type="button" onClick={() => setShowImageUpload(!showImageUpload)} style={s.toolBtn} title="ছবি যোগ করো">📷</button>
                <StickerPicker
                  onSelect={(sticker) => setContent(p => p + ` ${sticker.emoji} `)}
                  onImageUpload={(url) => setImageUrl(url)}
                />
              </div>
              <button
                type="button"
                onClick={submitComment}
                disabled={submitting || (!content.trim() && !imageUrl)}
                style={{ ...s.submitBtn, opacity: submitting || (!content.trim() && !imageUrl) ? .5 : 1 }}
              >
                {submitting ? 'পাঠানো হচ্ছে...' : 'মন্তব্য করো'}
              </button>
            </div>

            {showImageUpload && (
              <div style={{ marginTop: 10 }}>
                <ImageUpload
                  bucket="comments"
                  onUpload={(url) => { setImageUrl(url); setShowImageUpload(false) }}
                  height={120}
                  placeholder="মন্তব্যে ছবি যোগ করো"
                  showPreview={false}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={s.loginPrompt}>
          মন্তব্য করতে <a href="/auth" style={s.loginLink}>লগইন করো</a>
        </div>
      )}

      {/* Comments list */}
      <div style={s.commentList}>
        {loading ? (
          <p style={s.loading}>লোড হচ্ছে...</p>
        ) : comments.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyIcon}>💬</p>
            <p style={s.emptyText}>প্রথম মন্তব্যটি তুমিই করো!</p>
          </div>
        ) : (
          comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={user}
              currentProfile={profile}
              novelId={novelId}
              onDelete={deleteComment}
              onRefresh={fetchComments}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              replyImage={replyImage}
              setReplyImage={setReplyImage}
              onReplySubmit={submitReply}
              showReplyImageUpload={showReplyImageUpload}
              setShowReplyImageUpload={setShowReplyImageUpload}
            />
          ))
        )}
      </div>
    </div>
  )
}

function CommentItem({ comment, currentUser, currentProfile, novelId, onDelete, onRefresh, replyTo, setReplyTo, replyContent, setReplyContent, replyImage, setReplyImage, onReplySubmit, showReplyImageUpload, setShowReplyImageUpload }) {
  const [replies, setReplies] = useState([])
  const [showReplies, setShowReplies] = useState(false)
  const [replyCount, setReplyCount] = useState(0)

  useEffect(() => { countReplies() }, [])

  async function countReplies() {
    const { count } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('parent_id', comment.id)
    setReplyCount(count || 0)
  }

  async function loadReplies() {
    if (showReplies) { setShowReplies(false); return }
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('parent_id', comment.id)
      .order('created_at', { ascending: true })
    setReplies(data || [])
    setShowReplies(true)
  }

  // Parse content for images
  function renderContent(content) {
    const parts = content.split(/(\[image:[^\]]+\])/g)
    return parts.map((part, i) => {
      const match = part.match(/\[image:(.+)\]/)
      if (match) return <img key={i} src={match[1]} alt="" style={s.commentImg} />
      return <span key={i}>{part}</span>
    })
  }

  const isOwner = currentUser?.id === comment.user_id
  const isReplyingToThis = replyTo?.id === comment.id

  return (
    <div style={s.commentItem}>
      <div style={s.commentAvatar}>
        {comment.profiles?.avatar_url
          ? <img src={comment.profiles.avatar_url} style={s.avatarImg} alt="" />
          : <span style={s.avatarLetter}>{comment.profiles?.username?.[0]?.toUpperCase()}</span>
        }
      </div>
      <div style={s.commentBody}>
        <div style={s.commentHead}>
          <strong style={s.commentUser}>{comment.profiles?.username}</strong>
          {comment.rating && (
            <span style={s.commentRating}>
              {'★'.repeat(comment.rating)}{'☆'.repeat(5 - comment.rating)} {comment.rating}/5
            </span>
          )}
          <span style={s.commentTime}>{timeAgo(comment.created_at)}</span>
        </div>

        <div style={s.commentContent}>{renderContent(comment.content)}</div>

        <div style={s.commentActions}>
          {currentUser && (
            <button type="button" onClick={() => setReplyTo(isReplyingToThis ? null : { id: comment.id, username: comment.profiles?.username })} style={s.actionBtn}>
              {isReplyingToThis ? 'বাতিল' : '↩ Reply'}
            </button>
          )}
          {replyCount > 0 && (
            <button type="button" onClick={loadReplies} style={s.actionBtn}>
              {showReplies ? 'লুকাও' : `${replyCount}টি reply দেখো`}
            </button>
          )}
          {isOwner && (
            <button type="button" onClick={() => onDelete(comment.id)} style={s.deleteBtn}>মুছো</button>
          )}
        </div>

        {/* Reply form */}
        {isReplyingToThis && currentUser && (
          <div style={s.replyForm}>
            <div style={s.replyHeader}>
              <span style={s.replyingTo}>@{replyTo.username} কে reply করছ</span>
            </div>
            <textarea
              style={s.textarea}
              placeholder="reply লেখো..."
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              rows={2}
              autoFocus
            />
            {replyImage && (
              <div style={s.previewWrap}>
                <img src={replyImage} alt="" style={s.previewImg} />
                <button type="button" onClick={() => setReplyImage('')} style={s.removeImg}>✕</button>
              </div>
            )}
            <div style={s.toolbar}>
              <div style={s.toolbarLeft}>
                <button type="button" onClick={() => setShowReplyImageUpload(!showReplyImageUpload)} style={s.toolBtn} title="ছবি">📷</button>
                <StickerPicker
                  onSelect={(sticker) => setReplyContent(p => p + ` ${sticker.emoji} `)}
                  onImageUpload={(url) => setReplyImage(url)}
                />
              </div>
              <button type="button" onClick={onReplySubmit} style={s.submitBtnSm}>Reply করো</button>
            </div>
            {showReplyImageUpload && (
              <div style={{ marginTop: 8 }}>
                <ImageUpload
                  bucket="comments"
                  onUpload={(url) => { setReplyImage(url); setShowReplyImageUpload(false) }}
                  height={100}
                  placeholder="ছবি যোগ করো"
                  showPreview={false}
                />
              </div>
            )}
          </div>
        )}

        {/* Replies */}
        {showReplies && (
          <div style={s.repliesList}>
            {replies.map(reply => (
              <div key={reply.id} style={s.replyItem}>
                <div style={{ ...s.commentAvatar, width: 28, height: 28 }}>
                  {reply.profiles?.avatar_url
                    ? <img src={reply.profiles.avatar_url} style={s.avatarImg} alt="" />
                    : <span style={{ ...s.avatarLetter, fontSize: 11 }}>{reply.profiles?.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div style={s.commentBody}>
                  <div style={s.commentHead}>
                    <strong style={s.commentUser}>{reply.profiles?.username}</strong>
                    <span style={s.commentTime}>{timeAgo(reply.created_at)}</span>
                  </div>
                  <div style={s.commentContent}>{renderContent(reply.content)}</div>
                  {currentUser?.id === reply.user_id && (
                    <button type="button" onClick={() => onDelete(reply.id)} style={s.deleteBtn}>মুছো</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'এইমাত্র'
  if (mins < 60) return `${mins} মিনিট আগে`
  if (hours < 24) return `${hours} ঘণ্টা আগে`
  return `${days} দিন আগে`
}

const s = {
  wrap: { marginTop: '3rem', borderTop: '2px solid #0f0d0a', paddingTop: '2rem' },
  header: { marginBottom: '1.5rem' },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#0f0d0a', margin: '0 0 4px' },
  sub: { fontSize: 13, color: '#7a7267' },

  writeBox: { display: 'flex', gap: 12, marginBottom: '2rem', background: '#fff', border: '1px solid #d4cfc4', borderRadius: 10, padding: '1rem' },
  writeAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#c0392b', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarLetter: { fontSize: 15, fontWeight: 700, color: '#fff' },
  writeRight: { flex: 1, minWidth: 0 },

  ratingRow: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 },
  ratingLabel: { fontSize: 12, color: '#7a7267' },
  starBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', lineHeight: 1 },
  ratingVal: { fontSize: 12, color: '#b8860b', fontWeight: 600, marginLeft: 4 },

  textarea: { width: '100%', padding: '10px', border: '1px solid #d4cfc4', borderRadius: 6, fontSize: 14, fontFamily: "'Hind Siliguri', sans-serif", resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: '#0f0d0a' },

  previewWrap: { position: 'relative', display: 'inline-block', marginTop: 8 },
  previewImg: { maxWidth: 200, maxHeight: 150, borderRadius: 6, border: '1px solid #d4cfc4', display: 'block' },
  removeImg: { position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', background: '#c0392b', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  toolbarLeft: { display: 'flex', gap: 6 },
  toolBtn: { background: 'none', border: '1px solid #d4cfc4', borderRadius: 6, cursor: 'pointer', padding: '5px 8px', fontSize: 15 },
  submitBtn: { padding: '8px 20px', borderRadius: 6, background: '#1a2744', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  submitBtnSm: { padding: '6px 14px', borderRadius: 6, background: '#1a2744', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 },

  loginPrompt: { background: '#fff', border: '1px solid #d4cfc4', borderRadius: 10, padding: '1.5rem', textAlign: 'center', fontSize: 14, color: '#7a7267', marginBottom: '2rem' },
  loginLink: { color: '#c0392b', fontWeight: 600, textDecoration: 'none' },

  commentList: { display: 'flex', flexDirection: 'column', gap: 0 },
  loading: { color: '#7a7267', textAlign: 'center', padding: '2rem' },
  empty: { textAlign: 'center', padding: '3rem' },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#7a7267' },

  commentItem: { display: 'flex', gap: 12, padding: '1.25rem 0', borderBottom: '1px solid #ede9e0' },
  commentAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#1a2744', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  commentBody: { flex: 1, minWidth: 0 },
  commentHead: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  commentUser: { fontSize: 14, fontWeight: 600, color: '#0f0d0a' },
  commentRating: { fontSize: 12, color: '#b8860b' },
  commentTime: { fontSize: 12, color: '#b0a898' },
  commentContent: { fontSize: 14, color: '#1a1610', lineHeight: 1.7 },
  commentImg: { maxWidth: '100%', maxHeight: 200, borderRadius: 6, marginTop: 8, display: 'block', border: '1px solid #ede9e0' },
  commentActions: { display: 'flex', gap: 8, marginTop: 8 },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#7a7267', fontSize: 12, padding: '2px 0', textDecoration: 'underline' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: 12, padding: '2px 0', textDecoration: 'underline' },

  replyForm: { marginTop: 12, background: '#f7f4ef', borderRadius: 8, padding: '12px' },
  replyHeader: { marginBottom: 8 },
  replyingTo: { fontSize: 12, color: '#c0392b', fontWeight: 600 },

  repliesList: { marginTop: 12, display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 12, borderLeft: '2px solid #ede9e0' },
  replyItem: { display: 'flex', gap: 8, padding: '10px 0', borderBottom: '1px solid #ede9e0' },
}
