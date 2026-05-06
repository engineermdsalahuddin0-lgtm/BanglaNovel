import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/shared/Navbar'
import ImageUpload from '../components/shared/ImageUpload'

const TABS = [
  { key: 'overview', label: '👤 প্রোফাইল' },
  { key: 'activity', label: '📊 Activity' },
  { key: 'history', label: '📖 পড়ার ইতিহাস' },
  { key: 'tips', label: '💝 Tips' },
  { key: 'settings', label: '⚙️ সেটিংস' },
]

const POINT_RULES = [
  { icon: '📝', label: 'Chapter প্রকাশ', points: 50 },
  { icon: '💯', label: '১০০০ শব্দ লেখা', points: 20 },
  { icon: '🔥', label: '৭ দিনের streak', points: 100 },
  { icon: '📚', label: 'নতুন বই শুরু', points: 30 },
  { icon: '💝', label: 'Tip পাওয়া', points: 10 },
  { icon: '⭐', label: 'Featured হওয়া', points: 200 },
]

export default function Profile() {
  const { user, profile, isSubscribed, isWriter, fetchProfile, requestWriterRole } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [history, setHistory] = useState([])
  const [myTips, setMyTips] = useState([])
  const [writers, setWriters] = useState([])
  const [activity, setActivity] = useState([]) // 365 days
  const [pointsLog, setPointsLog] = useState([])
  const [loading, setLoading] = useState(true)

  // Settings
  const [form, setForm] = useState({ username: '', full_name: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Avatar
  const [showAvatarEdit, setShowAvatarEdit] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Writer request
  const [writerRequesting, setWriterRequesting] = useState(false)
  const [writerMsg, setWriterMsg] = useState('')

  // Tips
  const [showTipForm, setShowTipForm] = useState(false)
  const [tipForm, setTipForm] = useState({ to_writer_id: '', amount: '', message: '' })
  const [tipSaving, setTipSaving] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    fetchData()
  }, [user])

  useEffect(() => {
    if (profile) {
      setForm({ username: profile.username || '', full_name: profile.full_name || '', bio: profile.bio || '' })
    }
  }, [profile])

  async function fetchData() {
    setLoading(true)
    const [
      { data: historyData },
      { data: tipsData },
      { data: writersData },
      { data: activityData },
      { data: pointsData },
    ] = await Promise.all([
      supabase.from('reads').select('*, chapters(title, chapter_number), novels(title, slug)').eq('user_id', user.id).order('read_at', { ascending: false }).limit(30),
      supabase.from('tips').select('*, profiles!tips_to_writer_id_fkey(username)').eq('from_user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, username').eq('role', 'writer'),
      supabase.from('writing_activity').select('*').eq('user_id', user.id).order('activity_date', { ascending: false }).limit(365),
      supabase.from('points_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ])
    setHistory(historyData || [])
    setMyTips(tipsData || [])
    setWriters(writersData || [])
    setActivity(activityData || [])
    setPointsLog(pointsData || [])
    setLoading(false)
  }

  async function saveProfile() {
    if (!form.username.trim()) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ username: form.username, full_name: form.full_name, bio: form.bio }).eq('id', user.id)
    if (!error) { await fetchProfile(user.id); setSaveMsg('সেভ হয়েছে ✓'); setTimeout(() => setSaveMsg(''), 3000) }
    setSaving(false)
  }

  async function removeAvatar() {
    await supabase.from('profiles').update({ avatar_url: '' }).eq('id', user.id)
    await fetchProfile(user.id)
    setShowAvatarEdit(false)
  }

  async function handleWriterRequest() {
    setWriterRequesting(true)
    const { error } = await requestWriterRole()
    setWriterMsg(!error ? '✅ তুমি এখন একজন লেখক!' : 'সমস্যা হয়েছে।')
    setWriterRequesting(false)
  }

  async function sendTip() {
    if (!tipForm.to_writer_id || !tipForm.amount) return
    setTipSaving(true)
    const amount = parseFloat(tipForm.amount)
    await supabase.from('tips').insert({ from_user_id: user.id, to_writer_id: tipForm.to_writer_id, amount, platform_cut: parseFloat((amount * 0.30).toFixed(2)), writer_gets: parseFloat((amount * 0.70).toFixed(2)), message: tipForm.message, status: 'pending' })
    setShowTipForm(false); setTipForm({ to_writer_id: '', amount: '', message: '' })
    fetchData(); setTipSaving(false)
  }

  const historyByNovel = history.reduce((acc, read) => {
    const slug = read.novels?.slug
    if (!slug) return acc
    if (!acc[slug]) acc[slug] = { novel: read.novels, chapters: [] }
    acc[slug].chapters.push(read)
    return acc
  }, {})

  if (loading) return <><Navbar /><div style={s.loading}>লোড হচ্ছে...</div></>

  return (
    <div style={s.page}>
      <Navbar />

      {/* ── PROFILE HEADER ── */}
      <div style={s.header}>
        <div style={s.headerInner}>

          {/* Avatar with edit overlay */}
          <div style={s.avatarContainer}>
            <div style={s.bigAvatar}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} style={s.avatarImg} alt="" />
                : <span style={s.avatarLetter}>{profile?.username?.[0]?.toUpperCase()}</span>
              }
            </div>
            <button onClick={() => setShowAvatarEdit(!showAvatarEdit)} style={s.avatarEditBtn} title="ছবি বদলাও">✏️</button>

            {showAvatarEdit && (
              <div style={s.avatarDropdown}>
                <p style={s.avatarDropTitle}>প্রোফাইল ছবি</p>
                <ImageUpload
                  bucket="avatars"
                  currentUrl={profile?.avatar_url}
                  onUpload={async (url) => {
                    setAvatarUploading(true)
                    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
                    await fetchProfile(user.id)
                    setShowAvatarEdit(false)
                    setAvatarUploading(false)
                  }}
                  shape="circle"
                  width="120px"
                  height={120}
                  placeholder="নতুন ছবি"
                />
                {profile?.avatar_url && (
                  <button onClick={removeAvatar} style={s.removeAvatarBtn}>🗑️ ছবি মুছো</button>
                )}
                <button onClick={() => setShowAvatarEdit(false)} style={s.avatarCancelBtn}>বাতিল</button>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={s.headerInfo}>
            <div style={s.headerNameRow}>
              <h1 style={s.headerName}>{profile?.username}</h1>
              {profile?.current_streak > 0 && (
                <span style={s.streakBadge}>🔥 {profile.current_streak} দিনের streak</span>
              )}
            </div>
            {profile?.full_name && <p style={s.headerFullName}>{profile.full_name}</p>}
            {profile?.bio && <p style={s.headerBio}>{profile.bio}</p>}
            <div style={s.headerBadges}>
              <span style={profile?.role === 'admin' ? s.roleAdmin : profile?.role === 'writer' ? s.roleWriter : s.roleReader}>
                {profile?.role === 'admin' ? '👑 Admin' : profile?.role === 'writer' ? '✍️ Writer' : '📖 Reader'}
              </span>
              {isSubscribed
                ? <span style={s.subBadge}>🔑 Premium</span>
                : <Link to="/subscribe" style={s.upgradeBtn}>⬆️ Premium নাও</Link>
              }
            </div>
          </div>

          {/* Stats */}
          <div style={s.headerStats}>
            <div style={s.headerStat}>
              <strong style={s.headerStatNum}>{profile?.total_points || 0}</strong>
              <span style={s.headerStatLabel}>Points</span>
            </div>
            <div style={s.headerStatDiv} />
            <div style={s.headerStat}>
              <strong style={s.headerStatNum}>{profile?.longest_streak || 0}</strong>
              <span style={s.headerStatLabel}>Max Streak</span>
            </div>
            <div style={s.headerStatDiv} />
            <div style={s.headerStat}>
              <strong style={s.headerStatNum}>{history.length}</strong>
              <span style={s.headerStatLabel}>পড়া</span>
            </div>
            <div style={s.headerStatDiv} />
            <div style={s.headerStat}>
              <strong style={s.headerStatNum}>{myTips.length}</strong>
              <span style={s.headerStatLabel}>Tips</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabBar}>
        <div style={s.tabInner}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={tab === t.key ? s.tabActive : s.tab}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={s.content}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div style={s.twoCol}>
            {/* Recent reading */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <h3 style={s.cardTitle}>সাম্প্রতিক পড়া</h3>
                <button onClick={() => setTab('history')} style={s.cardLink}>সব দেখো →</button>
              </div>
              {Object.values(historyByNovel).slice(0, 4).map(({ novel, chapters }) => (
                <Link key={novel.slug} to={`/novel/${novel.slug}`} style={s.listRow}>
                  <span style={{ fontSize: 18 }}>📖</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.rowTitle}>{novel.title}</p>
                    <p style={s.rowSub}>{chapters.length}টি অধ্যায় পড়েছ</p>
                  </div>
                  <span style={s.rowArrow}>→</span>
                </Link>
              ))}
              {history.length === 0 && <div style={s.emptyMsg}><p>এখনো কিছু পড়োনি।</p><Link to="/novels" style={s.emptyLink}>বই খোঁজো →</Link></div>}
            </div>

            {/* Points overview */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <h3 style={s.cardTitle}>🏆 Points & Rewards</h3>
                <button onClick={() => setTab('activity')} style={s.cardLink}>বিস্তারিত →</button>
              </div>
              <div style={s.pointsTotal}>
                <span style={s.pointsTotalNum}>{profile?.total_points || 0}</span>
                <span style={s.pointsTotalLabel}>মোট Points</span>
              </div>
              <div style={s.pointsRuleGrid}>
                {POINT_RULES.map((rule, i) => (
                  <div key={i} style={s.pointsRule}>
                    <span>{rule.icon}</span>
                    <span style={s.pointsRuleLabel}>{rule.label}</span>
                    <span style={s.pointsRuleVal}>+{rule.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {tab === 'activity' && (
          <div>
            {/* Streak & Points summary */}
            <div style={s.activitySummary}>
              <div style={s.activitySummaryCard}>
                <span style={s.activitySummaryIcon}>🔥</span>
                <div>
                  <p style={s.activitySummaryNum}>{profile?.current_streak || 0} দিন</p>
                  <p style={s.activitySummaryLabel}>বর্তমান streak</p>
                </div>
              </div>
              <div style={s.activitySummaryCard}>
                <span style={s.activitySummaryIcon}>⭐</span>
                <div>
                  <p style={s.activitySummaryNum}>{profile?.longest_streak || 0} দিন</p>
                  <p style={s.activitySummaryLabel}>সর্বোচ্চ streak</p>
                </div>
              </div>
              <div style={s.activitySummaryCard}>
                <span style={s.activitySummaryIcon}>🏆</span>
                <div>
                  <p style={s.activitySummaryNum}>{profile?.total_points || 0}</p>
                  <p style={s.activitySummaryLabel}>মোট Points</p>
                </div>
              </div>
              <div style={s.activitySummaryCard}>
                <span style={s.activitySummaryIcon}>📝</span>
                <div>
                  <p style={s.activitySummaryNum}>{activity.reduce((a, d) => a + (d.chapters_published || 0), 0)}</p>
                  <p style={s.activitySummaryLabel}>মোট অধ্যায়</p>
                </div>
              </div>
            </div>

            {/* Activity heatmap */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <h3 style={s.cardTitle}>📅 Activity Graph — গত ১ বছর</h3>
              </div>
              <ActivityHeatmap activity={activity} />
              <div style={s.heatmapLegend}>
                <span style={s.heatmapLegendLabel}>কম</span>
                {['#ebedf0','#9be9a8','#40c463','#30a14e','#216e39'].map((c, i) => (
                  <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
                ))}
                <span style={s.heatmapLegendLabel}>বেশি</span>
              </div>
            </div>

            {/* Points log */}
            <div style={s.card}>
              <h3 style={s.cardTitle}>🎁 Points ইতিহাস</h3>
              {pointsLog.length === 0 ? (
                <div style={s.emptyMsg}>
                  <p>এখনো কোনো points নেই।</p>
                  {isWriter && <p style={{ fontSize: 12, color: '#7a7267', marginTop: 4 }}>Chapter প্রকাশ করলে points পাবে!</p>}
                </div>
              ) : (
                <div>
                  {pointsLog.map(log => (
                    <div key={log.id} style={s.pointsLogRow}>
                      <div style={{ flex: 1 }}>
                        <p style={s.rowTitle}>{log.reason}</p>
                        <p style={s.rowSub}>{new Date(log.created_at).toLocaleDateString('bn-BD')}</p>
                      </div>
                      <span style={s.pointsLogVal}>+{log.points} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Point rules */}
            <div style={s.card}>
              <h3 style={s.cardTitle}>📋 Points পাওয়ার নিয়ম</h3>
              <div style={s.rulesGrid}>
                {POINT_RULES.map((rule, i) => (
                  <div key={i} style={s.ruleCard}>
                    <span style={s.ruleIcon}>{rule.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={s.ruleLabel}>{rule.label}</p>
                    </div>
                    <span style={s.rulePoints}>+{rule.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── READING HISTORY ── */}
        {tab === 'history' && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>পড়ার ইতিহাস ({history.length}টি)</h3>
            {Object.values(historyByNovel).map(({ novel, chapters }) => (
              <div key={novel.slug} style={s.novelHistoryBlock}>
                <Link to={`/novel/${novel.slug}`} style={s.novelHistoryTitle}>{novel.title}</Link>
                <div style={s.chapterHistoryList}>
                  {chapters.map(read => (
                    <Link key={read.id} to={`/novel/${novel.slug}/chapter/${read.chapters?.chapter_number}`} style={s.chapterHistoryItem}>
                      <span>অধ্যায় {read.chapters?.chapter_number} — {read.chapters?.title}</span>
                      <span style={s.readDate}>{new Date(read.read_at).toLocaleDateString('bn-BD')}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            {history.length === 0 && <div style={s.emptyMsg}><p>এখনো কিছু পড়োনি।</p><Link to="/novels" style={s.emptyLink}>বই খোঁজো →</Link></div>}
          </div>
        )}

        {/* ── TIPS ── */}
        {tab === 'tips' && (
          <div style={s.card}>
            <div style={s.cardHead}>
              <h3 style={s.cardTitle}>আমার Tips ({myTips.length}টি)</h3>
              <button onClick={() => setShowTipForm(!showTipForm)} style={s.primaryBtn}>+ নতুন Tip</button>
            </div>
            {showTipForm && (
              <div style={s.tipForm}>
                <div style={s.formGrid}>
                  <div style={s.formGroup}>
                    <label style={s.label}>লেখক *</label>
                    <select style={s.input} value={tipForm.to_writer_id} onChange={e => setTipForm(p => ({ ...p, to_writer_id: e.target.value }))}>
                      <option value="">লেখক বেছে নাও</option>
                      {writers.map(w => <option key={w.id} value={w.id}>{w.username}</option>)}
                    </select>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>পরিমাণ (৳) *</label>
                    <input style={s.input} type="number" min="10" value={tipForm.amount} onChange={e => setTipForm(p => ({ ...p, amount: e.target.value }))} />
                    {tipForm.amount && <p style={s.hint}>লেখক পাবে: ৳{(tipForm.amount * 0.7).toFixed(0)}</p>}
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>বার্তা</label>
                  <input style={s.input} placeholder="লেখককে কিছু বলো..." value={tipForm.message} onChange={e => setTipForm(p => ({ ...p, message: e.target.value }))} />
                </div>
                <div style={s.formActions}>
                  <button onClick={() => setShowTipForm(false)} style={s.cancelBtn}>বাতিল</button>
                  <button onClick={sendTip} disabled={tipSaving} style={s.primaryBtn}>{tipSaving ? 'পাঠানো হচ্ছে...' : '💝 Tip পাঠাও'}</button>
                </div>
              </div>
            )}
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{['লেখক','পরিমাণ','বার্তা','Status','তারিখ'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {myTips.map(tip => (
                    <tr key={tip.id} style={s.tr}>
                      <td style={s.td}>{tip.profiles?.username}</td>
                      <td style={s.td}><strong>৳{tip.amount}</strong></td>
                      <td style={s.td}>{tip.message || '—'}</td>
                      <td style={s.td}><span style={tip.status === 'confirmed' ? s.tagConfirmed : s.tagPending}>{tip.status === 'confirmed' ? 'নিশ্চিত' : 'অপেক্ষায়'}</span></td>
                      <td style={s.td}>{new Date(tip.created_at).toLocaleDateString('bn-BD')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {myTips.length === 0 && <div style={s.tableEmpty}>এখনো কাউকে tip দাওনি।</div>}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <div style={s.settingsWrap}>

            {/* Profile edit */}
            <div style={s.card}>
              <h3 style={s.cardTitle}>প্রোফাইল সম্পাদনা</h3>

              {/* Avatar edit in settings */}
              <div style={s.formGroup}>
                <label style={s.label}>প্রোফাইল ছবি</label>
                <div style={s.avatarSettingsRow}>
                  <div style={s.settingsAvatar}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} style={s.avatarImg} alt="" />
                      : <span style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{profile?.username?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div style={s.avatarSettingsActions}>
                    <ImageUpload
                      bucket="avatars"
                      currentUrl={profile?.avatar_url}
                      onUpload={async (url) => {
                        await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
                        await fetchProfile(user.id)
                      }}
                      height={80}
                      width="160px"
                      placeholder="নতুন ছবি আপলোড"
                      showPreview={false}
                    />
                    {profile?.avatar_url && (
                      <button onClick={removeAvatar} style={s.removeAvatarBtnSmall}>🗑️ মুছো</button>
                    )}
                  </div>
                </div>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Username *</label>
                <input style={s.input} value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>পুরো নাম</label>
                <input style={s.input} placeholder="তোমার পুরো নাম" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Bio</label>
                <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
              </div>
              <div style={s.formActions}>
                {saveMsg && <span style={s.saveMsg}>{saveMsg}</span>}
                <button onClick={saveProfile} disabled={saving} style={s.primaryBtn}>{saving ? 'সেভ হচ্ছে...' : 'সেভ করো'}</button>
              </div>
            </div>

            {/* Subscription */}
            <div style={s.card}>
              <h3 style={s.cardTitle}>সাবস্ক্রিপশন</h3>
              {isSubscribed ? (
                <div>
                  <span style={s.subBadge}>🔑 Premium Active</span>
                  <p style={s.subExpiry}>মেয়াদ: {new Date(profile?.subscription_expires_at).toLocaleDateString('bn-BD')} পর্যন্ত</p>
                  <Link to="/subscribe" style={{ ...s.primaryBtn, display: 'inline-block', marginTop: 12, textDecoration: 'none' }}>🔄 Renew করো</Link>
                </div>
              ) : (
                <div>
                  <p style={s.subDesc}>Premium নিলে সব chapter পড়তে পারবে, বিজ্ঞাপন থাকবে না।</p>
                  <Link to="/subscribe" style={{ ...s.primaryBtn, display: 'inline-block', textDecoration: 'none' }}>🔑 Premium নাও — ৳৪৯/মাস</Link>
                </div>
              )}
            </div>

            {/* Writer request */}
            {profile?.role === 'reader' && (
              <div style={s.card}>
                <h3 style={s.cardTitle}>লেখক হতে চাও?</h3>
                <p style={{ fontSize: 13, color: '#7a7267', marginBottom: '1rem', lineHeight: 1.6 }}>লেখক হলে বই প্রকাশ করতে পারবে, points পাবে এবং readers এর কাছ থেকে tips পাবে।</p>
                <div style={s.perksGrid}>
                  {['📚 বই প্রকাশ করো', '💰 Tips থেকে আয়', '🏆 Contest এ অংশ নাও', '🎯 Points & rewards'].map((perk, i) => (
                    <div key={i} style={s.perkItem}><span style={{ color: '#10b981', fontWeight: 700 }}>✓</span> {perk}</div>
                  ))}
                </div>
                {writerMsg
                  ? <div style={s.writerSuccessMsg}>{writerMsg} <Link to="/writer" style={s.writerLink}>Dashboard →</Link></div>
                  : <button onClick={handleWriterRequest} disabled={writerRequesting} style={s.primaryBtn}>{writerRequesting ? 'প্রক্রিয়া হচ্ছে...' : '✍️ লেখক হিসেবে যোগ দাও'}</button>
                }
              </div>
            )}

            {profile?.role === 'writer' && (
              <div style={s.card}>
                <h3 style={s.cardTitle}>✍️ তুমি একজন লেখক</h3>
                <p style={{ fontSize: 13, color: '#7a7267', marginBottom: '1rem' }}>Writer Dashboard থেকে তোমার বই manage করো।</p>
                <Link to="/writer" style={{ ...s.primaryBtn, display: 'inline-block', textDecoration: 'none' }}>Writer Dashboard →</Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ── ACTIVITY HEATMAP ──
function ActivityHeatmap({ activity }) {
  const today = new Date()
  const cells = []

  // Build 52 weeks × 7 days = 364 cells
  for (let w = 51; w >= 0; w--) {
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today)
      date.setDate(today.getDate() - (w * 7 + d))
      const dateStr = date.toISOString().split('T')[0]
      const dayData = activity.find(a => a.activity_date === dateStr)
      const level = !dayData ? 0
        : dayData.chapters_published >= 2 ? 4
        : dayData.chapters_published >= 1 ? 3
        : dayData.words_written >= 500 ? 2
        : dayData.words_written > 0 ? 1 : 0

      cells.push({ dateStr, level, data: dayData, week: 51 - w, day: 6 - d })
    }
  }

  const COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
  const MONTHS = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলা', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে']
  const DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']

  const [tooltip, setTooltip] = useState(null)

  // Group by week for rendering
  const weeks = []
  for (let w = 0; w < 52; w++) {
    weeks.push(cells.filter(c => c.week === w))
  }

  return (
    <div style={s.heatmapWrap}>
      <div style={s.heatmapScroll}>
        <div style={s.heatmapGrid}>
          {/* Day labels */}
          <div style={s.heatmapDayLabels}>
            {DAYS.map((d, i) => (
              <div key={i} style={s.heatmapDayLabel}>{i % 2 === 1 ? d : ''}</div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} style={s.heatmapWeek}>
              {week.map((cell, di) => (
                <div
                  key={di}
                  style={{ ...s.heatmapCell, background: COLORS[cell.level] }}
                  onMouseEnter={(e) => setTooltip({ cell, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div style={{ ...s.heatmapTooltip, position: 'fixed', top: tooltip.y - 60, left: tooltip.x - 80 }}>
            <strong>{tooltip.cell.dateStr}</strong>
            {tooltip.cell.data ? (
              <div style={{ fontSize: 11, marginTop: 3 }}>
                <div>{tooltip.cell.data.words_written || 0} শব্দ</div>
                <div>{tooltip.cell.data.chapters_published || 0} অধ্যায়</div>
                <div>+{tooltip.cell.data.points_earned || 0} pts</div>
              </div>
            ) : <div style={{ fontSize: 11, marginTop: 2, opacity: .7 }}>কোনো activity নেই</div>}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#f8f9fa' },
  loading: { padding: '4rem', textAlign: 'center', color: '#888' },

  // Header
  header: { background: '#fff', borderBottom: '1px solid #e8eaed', padding: '1.5rem 0' },
  headerInner: { maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' },

  // Avatar
  avatarContainer: { position: 'relative', flexShrink: 0 },
  bigAvatar: { width: 80, height: 80, borderRadius: '50%', background: '#c0392b', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 2px 12px rgba(0,0,0,.1)' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarLetter: { fontSize: 32, fontWeight: 700, color: '#fff' },
  avatarEditBtn: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: '#1a2744', color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarDropdown: { position: 'absolute', top: 90, left: 0, background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.12)', padding: '1rem', zIndex: 100, width: 180, display: 'flex', flexDirection: 'column', gap: 8 },
  avatarDropTitle: { fontSize: 13, fontWeight: 600, color: '#11181c', margin: 0 },
  removeAvatarBtn: { width: '100%', padding: '7px', borderRadius: 6, background: '#fce4ec', color: '#c62828', border: 'none', cursor: 'pointer', fontSize: 12 },
  removeAvatarBtnSmall: { padding: '6px 12px', borderRadius: 6, background: '#fce4ec', color: '#c62828', border: 'none', cursor: 'pointer', fontSize: 12, marginTop: 6 },
  avatarCancelBtn: { width: '100%', padding: '7px', borderRadius: 6, background: '#f1f3f4', color: '#687076', border: 'none', cursor: 'pointer', fontSize: 12 },

  // Settings avatar
  avatarSettingsRow: { display: 'flex', alignItems: 'center', gap: 16 },
  settingsAvatar: { width: 64, height: 64, borderRadius: '50%', background: '#c0392b', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  avatarSettingsActions: { display: 'flex', flexDirection: 'column', gap: 6 },

  headerInfo: { flex: 1, minWidth: 200 },
  headerNameRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 2 },
  headerName: { fontSize: 22, fontWeight: 700, color: '#11181c', margin: 0 },
  streakBadge: { fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#fff3e0', color: '#e65100', fontWeight: 600 },
  headerFullName: { fontSize: 14, color: '#687076', margin: '0 0 4px' },
  headerBio: { fontSize: 13, color: '#687076', margin: '0 0 8px', lineHeight: 1.5 },
  headerBadges: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  roleAdmin: { fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#fce4ec', color: '#c62828', fontWeight: 500 },
  roleWriter: { fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#ede7f6', color: '#4527a0', fontWeight: 500 },
  roleReader: { fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#e8f5e9', color: '#2e7d32', fontWeight: 500 },
  subBadge: { fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#fff8e1', color: '#f57c00', fontWeight: 500 },
  upgradeBtn: { fontSize: 12, padding: '4px 12px', borderRadius: 20, background: '#11181c', color: '#fff', textDecoration: 'none', fontWeight: 500 },

  headerStats: { display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto', flexWrap: 'wrap' },
  headerStat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  headerStatNum: { fontSize: 20, fontWeight: 700, color: '#11181c' },
  headerStatLabel: { fontSize: 11, color: '#687076', marginTop: 1 },
  headerStatDiv: { width: 1, height: 28, background: '#e8eaed' },

  // Tabs
  tabBar: { background: '#fff', borderBottom: '1px solid #e8eaed' },
  tabInner: { maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', display: 'flex', overflowX: 'auto' },
  tab: { padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#687076', borderBottom: '2px solid transparent', whiteSpace: 'nowrap' },
  tabActive: { padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#11181c', fontWeight: 500, borderBottom: '2px solid #11181c', whiteSpace: 'nowrap' },

  content: { maxWidth: 1100, margin: '0 auto', padding: '1.5rem' },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 },

  card: { background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', padding: '1.25rem', marginBottom: 14 },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#11181c', margin: '0 0 1rem' },
  cardLink: { fontSize: 12, color: '#3451b2', background: 'none', border: 'none', cursor: 'pointer' },

  listRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f3f4', textDecoration: 'none', color: 'inherit' },
  rowTitle: { fontSize: 13, fontWeight: 500, color: '#11181c', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowSub: { fontSize: 12, color: '#687076', margin: '2px 0 0' },
  rowArrow: { color: '#687076', fontSize: 14 },
  emptyMsg: { textAlign: 'center', padding: '2rem', color: '#687076' },
  emptyLink: { color: '#c0392b', textDecoration: 'none', fontSize: 13, fontWeight: 500 },

  // Points
  pointsTotal: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0 1rem', borderBottom: '1px solid #f1f3f4', marginBottom: '1rem' },
  pointsTotalNum: { fontSize: 48, fontWeight: 900, color: '#1a2744', lineHeight: 1 },
  pointsTotalLabel: { fontSize: 13, color: '#687076', marginTop: 4 },
  pointsRuleGrid: { display: 'flex', flexDirection: 'column', gap: 0 },
  pointsRule: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f3f4', fontSize: 13 },
  pointsRuleLabel: { flex: 1, color: '#11181c' },
  pointsRuleVal: { fontWeight: 700, color: '#10b981', fontSize: 12 },

  // Activity summary
  activitySummary: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 14 },
  activitySummaryCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', padding: '1rem', display: 'flex', alignItems: 'center', gap: 12 },
  activitySummaryIcon: { fontSize: 28 },
  activitySummaryNum: { fontSize: 20, fontWeight: 700, color: '#11181c', margin: 0 },
  activitySummaryLabel: { fontSize: 12, color: '#687076', margin: '2px 0 0' },

  // Heatmap
  heatmapWrap: { padding: '0.5rem 0 1rem' },
  heatmapScroll: { overflowX: 'auto', position: 'relative' },
  heatmapGrid: { display: 'flex', gap: 3, alignItems: 'flex-start', minWidth: 600 },
  heatmapDayLabels: { display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 2 },
  heatmapDayLabel: { height: 13, fontSize: 9, color: '#687076', lineHeight: '13px', width: 28, textAlign: 'right', paddingRight: 4 },
  heatmapWeek: { display: 'flex', flexDirection: 'column', gap: 3 },
  heatmapCell: { width: 13, height: 13, borderRadius: 2, cursor: 'pointer', transition: 'opacity .1s' },
  heatmapTooltip: { background: '#24292e', color: '#fff', padding: '8px 10px', borderRadius: 6, fontSize: 12, pointerEvents: 'none', zIndex: 999, minWidth: 130 },
  heatmapLegend: { display: 'flex', alignItems: 'center', gap: 4, marginTop: '0.75rem', justifyContent: 'flex-end' },
  heatmapLegendLabel: { fontSize: 11, color: '#687076' },

  pointsLogRow: { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f3f4' },
  pointsLogVal: { fontSize: 13, fontWeight: 700, color: '#10b981' },

  rulesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 },
  ruleCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8f9fa', borderRadius: 8, border: '1px solid #e8eaed' },
  ruleIcon: { fontSize: 20 },
  ruleLabel: { fontSize: 13, color: '#11181c', flex: 1, margin: 0 },
  rulePoints: { fontSize: 12, fontWeight: 700, color: '#10b981' },

  // History
  novelHistoryBlock: { marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f3f4' },
  novelHistoryTitle: { fontSize: 14, fontWeight: 600, color: '#3451b2', textDecoration: 'none', display: 'block', marginBottom: 8 },
  chapterHistoryList: { display: 'flex', flexDirection: 'column', gap: 4 },
  chapterHistoryItem: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#11181c', padding: '6px 10px', borderRadius: 6, background: '#f8f9fa', textDecoration: 'none' },
  readDate: { fontSize: 11, color: '#aaa' },

  // Settings
  settingsWrap: { display: 'flex', flexDirection: 'column', gap: 0 },
  subExpiry: { fontSize: 13, color: '#687076', margin: '6px 0 0' },
  subDesc: { fontSize: 13, color: '#687076', marginBottom: 12 },
  saveMsg: { fontSize: 13, color: '#2e7d32', fontWeight: 500 },
  perksGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1rem' },
  perkItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#11181c' },
  writerSuccessMsg: { fontSize: 13, color: '#2e7d32', background: '#e8f5e9', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 },
  writerLink: { color: '#1565c0', fontWeight: 500, textDecoration: 'none' },

  // Tips
  tipForm: { background: '#f8f9fa', borderRadius: 8, padding: '1rem', marginBottom: '1rem', border: '1px solid #e8eaed' },

  // Table
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#687076', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid #e8eaed', textAlign: 'left', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f1f3f4' },
  td: { padding: '11px 12px', fontSize: 13, color: '#11181c', verticalAlign: 'middle' },
  tableEmpty: { textAlign: 'center', padding: '2.5rem', color: '#687076' },
  tagConfirmed: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#e8f5e9', color: '#2e7d32', fontWeight: 500 },
  tagPending: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#fff8e1', color: '#f57c00', fontWeight: 500 },

  // Form
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  formGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: 500, color: '#11181c', marginBottom: 6, display: 'block' },
  input: { width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #e8eaed', fontSize: 13, outline: 'none', color: '#11181c', background: '#fff', boxSizing: 'border-box' },
  hint: { fontSize: 12, color: '#2e7d32', marginTop: 4, fontWeight: 500 },
  formActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 },
  primaryBtn: { padding: '8px 18px', borderRadius: 7, background: '#11181c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  cancelBtn: { padding: '8px 18px', borderRadius: 7, background: '#fff', color: '#687076', border: '1px solid #e8eaed', cursor: 'pointer', fontSize: 13 },
}
