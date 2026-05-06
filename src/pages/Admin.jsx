import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/shared/Navbar'

export default function Admin() {
  const { user, profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [users, setUsers] = useState([])
  const [novels, setNovels] = useState([])
  const [subs, setSubs] = useState([])
  const [tips, setTips] = useState([])
  const [contests, setContests] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)

    const [
      { data: usersData },
      { data: novelsData },
      { data: subsData },
      { data: tipsData },
      { data: contestsData },
    ] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('novels').select('*, profiles!novels_writer_id_fkey(username)').order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*, profiles!subscriptions_user_id_fkey(username)').order('created_at', { ascending: false }),
      supabase.from('tips').select('*, profiles!tips_from_user_id_fkey(username), profiles!tips_to_writer_id_fkey(username)').order('created_at', { ascending: false }).limit(50),
      supabase.from('contests').select('*').order('created_at', { ascending: false }),
    ])

    const totalRevenue = subsData?.filter(s => s.status === 'active').reduce((a, s) => a + (s.amount || 0), 0) || 0
    const totalTips = tipsData?.reduce((a, t) => a + (t.platform_cut || 0), 0) || 0

    setUsers(usersData || [])
    setNovels(novelsData || [])
    setSubs(subsData || [])
    setTips(tipsData || [])
    setContests(contestsData || [])
    setStats({
      totalUsers: usersData?.length || 0,
      totalNovels: novelsData?.length || 0,
      totalSubs: subsData?.filter(s => s.status === 'active').length || 0,
      totalRevenue: totalRevenue + totalTips,
      pendingSubs: subsData?.filter(s => s.status === 'pending').length || 0,
    })
    setLoading(false)
  }

  // Subscription activate
  async function activateSub(sub) {
    const expires = new Date()
    expires.setMonth(expires.getMonth() + 1)
    await supabase.from('subscriptions').update({
      status: 'active',
      activated_by: user.id,
      starts_at: new Date().toISOString(),
      expires_at: expires.toISOString(),
    }).eq('id', sub.id)
    await supabase.from('profiles').update({
      is_subscribed: true,
      subscription_expires_at: expires.toISOString(),
    }).eq('id', sub.user_id)
    fetchAll()
  }

  async function rejectSub(id) {
    await supabase.from('subscriptions').update({ status: 'expired' }).eq('id', id)
    fetchAll()
  }

  // User role change
  async function changeRole(userId, role) {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    fetchAll()
  }

  // Novel feature toggle
  async function toggleFeature(novel) {
    await supabase.from('novels').update({ is_featured: !novel.is_featured }).eq('id', novel.id)
    fetchAll()
  }

  // Contest create
  const [contestForm, setContestForm] = useState({ title: '', description: '', genre: '', entry_fee: 100, starts_at: '', ends_at: '' })
  const [showContestForm, setShowContestForm] = useState(false)

  async function saveContest() {
    if (!contestForm.title || !contestForm.starts_at || !contestForm.ends_at) return
    await supabase.from('contests').insert({
      ...contestForm,
      status: 'upcoming',
    })
    setShowContestForm(false)
    setContestForm({ title: '', description: '', genre: '', entry_fee: 100, starts_at: '', ends_at: '' })
    fetchAll()
  }

  async function updateContestStatus(id, status) {
    await supabase.from('contests').update({ status }).eq('id', id)
    fetchAll()
  }

  if (loading) return <><Navbar /><div style={s.loading}>লোড হচ্ছে...</div></>

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.header}>
        <div style={s.headerInner}>
          <div>
            <h1 style={s.headerTitle}>অ্যাডমিন প্যানেল</h1>
            <p style={s.headerSub}>প্ল্যাটফর্ম ম্যানেজমেন্ট</p>
          </div>
          {stats.pendingSubs > 0 && (
            <div style={s.alertBadge}>
              ⚠️ {stats.pendingSubs}টি সাবস্ক্রিপশন অপেক্ষায়
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabBar}>
        <div style={s.tabInner}>
          {[
            { key: 'overview', label: '📊 ওভারভিউ' },
            { key: 'users', label: `👥 ইউজার (${stats.totalUsers})` },
            { key: 'novels', label: `📚 বই (${stats.totalNovels})` },
            { key: 'subscriptions', label: `🔑 সাবস্ক্রিপশন ${stats.pendingSubs > 0 ? `(${stats.pendingSubs} pending)` : ''}` },
            { key: 'tips', label: '💝 টিপস' },
            { key: 'contests', label: '🏆 কনটেস্ট' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={tab === t.key ? s.tabActive : s.tab}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={s.content}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={s.statsGrid}>
              <StatCard icon="👥" label="মোট ইউজার" value={stats.totalUsers} />
              <StatCard icon="📚" label="মোট বই" value={stats.totalNovels} />
              <StatCard icon="🔑" label="সক্রিয় সাব" value={stats.totalSubs} />
              <StatCard icon="💰" label="মোট রেভিনিউ" value={`৳${stats.totalRevenue?.toFixed(0)}`} />
            </div>

            {/* Pending subs alert */}
            {stats.pendingSubs > 0 && (
              <div style={s.alertCard}>
                <span>⚠️ <strong>{stats.pendingSubs}টি</strong> সাবস্ক্রিপশন payment verify করা বাকি।</span>
                <button onClick={() => setTab('subscriptions')} style={s.alertBtn}>এখনই দেখো →</button>
              </div>
            )}

            <div style={s.twoCol}>
              {/* Recent users */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>সাম্প্রতিক ইউজার</h3>
                {users.slice(0, 5).map(u => (
                  <div key={u.id} style={s.listRow}>
                    <div style={s.userAvatar}>{u.username?.[0]?.toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <p style={s.rowTitle}>{u.username}</p>
                      <p style={s.rowSub}>{u.role}</p>
                    </div>
                    <span style={u.is_subscribed ? s.tagActive : s.tagInactive}>
                      {u.is_subscribed ? 'সাবস্ক্রাইবড' : 'ফ্রি'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Recent novels */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>সাম্প্রতিক বই</h3>
                {novels.slice(0, 5).map(n => (
                  <div key={n.id} style={s.listRow}>
                    <div style={{ flex: 1 }}>
                      <p style={s.rowTitle}>{n.title}</p>
                      <p style={s.rowSub}>{n.profiles?.username} · {n.total_views} ভিউ</p>
                    </div>
                    <button onClick={() => toggleFeature(n)} style={n.is_featured ? s.featuredBtn : s.actionBtn}>
                      {n.is_featured ? '⭐ ফিচার্ড' : 'ফিচার করো'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div style={s.card}>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>{['ইউজার', 'Role', 'সাবস্ক্রিপশন', 'যোগদান', 'Action'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={s.tr}>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={s.userAvatar}>{u.username?.[0]?.toUpperCase()}</div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 500 }}>{u.username}</p>
                            <p style={{ margin: 0, fontSize: 12, color: '#687076' }}>{u.full_name}</p>
                          </div>
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={
                          u.role === 'admin' ? s.tagAdmin :
                          u.role === 'writer' ? s.tagWriter : s.tagReader
                        }>{u.role}</span>
                      </td>
                      <td style={s.td}>
                        <span style={u.is_subscribed ? s.tagActive : s.tagInactive}>
                          {u.is_subscribed ? `সক্রিয় · ${new Date(u.subscription_expires_at).toLocaleDateString('bn-BD')} পর্যন্ত` : 'ফ্রি'}
                        </span>
                      </td>
                      <td style={s.td}>{new Date(u.created_at).toLocaleDateString('bn-BD')}</td>
                      <td style={s.td}>
                        <select
                          value={u.role}
                          onChange={e => changeRole(u.id, e.target.value)}
                          style={s.selectSmall}
                        >
                          <option value="reader">reader</option>
                          <option value="writer">writer</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NOVELS TAB */}
        {tab === 'novels' && (
          <div style={s.card}>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>{['বইয়ের নাম', 'লেখক', 'ঘরানা', 'ভিউ', 'অবস্থা', 'Action'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {novels.map(n => (
                    <tr key={n.id} style={s.tr}>
                      <td style={s.td}><span style={{ fontWeight: 500 }}>{n.title}</span></td>
                      <td style={s.td}>{n.profiles?.username}</td>
                      <td style={s.td}><span style={s.genreTag}>{n.genre}</span></td>
                      <td style={s.td}>{n.total_views}</td>
                      <td style={s.td}>
                        <span style={n.status === 'completed' ? s.tagComplete : s.tagOngoing}>
                          {n.status === 'completed' ? 'সম্পূর্ণ' : 'চলমান'}
                        </span>
                      </td>
                      <td style={s.td}>
                        <button onClick={() => toggleFeature(n)} style={n.is_featured ? s.featuredBtn : s.actionBtn}>
                          {n.is_featured ? '⭐ আনফিচার' : 'ফিচার করো'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS TAB */}
        {tab === 'subscriptions' && (
          <div>
            {subs.filter(s => s.status === 'pending').length > 0 && (
              <div style={s.pendingSection}>
                <h3 style={s.sectionTitle}>⚠️ Pending — Verify করো</h3>
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr>{['ইউজার', 'প্ল্যান', 'পরিমাণ', 'Payment Method', 'Transaction ID', 'তারিখ', 'Action'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {subs.filter(sub => sub.status === 'pending').map(sub => (
                        <tr key={sub.id} style={s.tr}>
                          <td style={s.td}>{sub.profiles?.username}</td>
                          <td style={s.td}><span style={s.tagWriter}>{sub.plan}</span></td>
                          <td style={s.td}><strong>৳{sub.amount}</strong></td>
                          <td style={s.td}>{sub.payment_method}</td>
                          <td style={s.td}><code style={s.code}>{sub.transaction_id || '—'}</code></td>
                          <td style={s.td}>{new Date(sub.created_at).toLocaleDateString('bn-BD')}</td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => activateSub(sub)} style={s.activateBtn}>✅ Activate</button>
                              <button onClick={() => rejectSub(sub.id)} style={s.rejectBtn}>❌ Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={s.card}>
              <h3 style={s.cardTitle}>সব সাবস্ক্রিপশন</h3>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>{['ইউজার', 'প্ল্যান', 'পরিমাণ', 'Status', 'মেয়াদ', 'তারিখ'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {subs.map(sub => (
                      <tr key={sub.id} style={s.tr}>
                        <td style={s.td}>{sub.profiles?.username}</td>
                        <td style={s.td}>{sub.plan}</td>
                        <td style={s.td}>৳{sub.amount}</td>
                        <td style={s.td}>
                          <span style={
                            sub.status === 'active' ? s.tagActive :
                            sub.status === 'pending' ? s.tagPending : s.tagInactive
                          }>{sub.status}</span>
                        </td>
                        <td style={s.td}>{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('bn-BD') : '—'}</td>
                        <td style={s.td}>{new Date(sub.created_at).toLocaleDateString('bn-BD')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {subs.length === 0 && <div style={s.tableEmpty}>এখনো কোনো সাবস্ক্রিপশন নেই।</div>}
              </div>
            </div>
          </div>
        )}

        {/* TIPS TAB */}
        {tab === 'tips' && (
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h3 style={s.cardTitle}>সব টিপস</h3>
              <span style={s.revenueTag}>Platform revenue: ৳{tips.reduce((a, t) => a + (t.platform_cut || 0), 0).toFixed(0)}</span>
            </div>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>{['পাঠক', 'লেখক', 'পরিমাণ', 'Platform (৩০%)', 'Writer (৭০%)', 'Status', 'তারিখ'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {tips.map(tip => (
                    <tr key={tip.id} style={s.tr}>
                      <td style={s.td}>{tip['profiles']?.username || '—'}</td>
                      <td style={s.td}>{tip.to_writer_id}</td>
                      <td style={s.td}>৳{tip.amount}</td>
                      <td style={s.td}><strong style={{ color: '#1565c0' }}>৳{tip.platform_cut}</strong></td>
                      <td style={s.td}><strong style={{ color: '#2e7d32' }}>৳{tip.writer_gets}</strong></td>
                      <td style={s.td}><span style={tip.status === 'confirmed' ? s.tagActive : s.tagPending}>{tip.status}</span></td>
                      <td style={s.td}>{new Date(tip.created_at).toLocaleDateString('bn-BD')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tips.length === 0 && <div style={s.tableEmpty}>এখনো কোনো টিপস নেই।</div>}
            </div>
          </div>
        )}

        {/* CONTESTS TAB */}
        {tab === 'contests' && (
          <div>
            {showContestForm && (
              <div style={s.formCard}>
                <h3 style={s.formTitle}>নতুন কনটেস্ট তৈরি করো</h3>
                <div style={s.formGrid}>
                  <div style={s.formGroup}>
                    <label style={s.label}>কনটেস্টের নাম *</label>
                    <input style={s.input} placeholder="যেমন: রমজান বিশেষ লেখা প্রতিযোগিতা"
                      value={contestForm.title} onChange={e => setContestForm(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>ঘরানা</label>
                    <select style={s.input} value={contestForm.genre}
                      onChange={e => setContestForm(p => ({ ...p, genre: e.target.value }))}>
                      <option value="">সব ঘরানা</option>
                      <option value="romance">রোমান্স</option>
                      <option value="fantasy">ফ্যান্টাসি</option>
                      <option value="thriller">থ্রিলার</option>
                      <option value="horror">হরর</option>
                    </select>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Entry Fee (৳)</label>
                    <input style={s.input} type="number" value={contestForm.entry_fee}
                      onChange={e => setContestForm(p => ({ ...p, entry_fee: parseInt(e.target.value) }))} />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>শুরুর তারিখ *</label>
                    <input style={s.input} type="datetime-local" value={contestForm.starts_at}
                      onChange={e => setContestForm(p => ({ ...p, starts_at: e.target.value }))} />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>শেষের তারিখ *</label>
                    <input style={s.input} type="datetime-local" value={contestForm.ends_at}
                      onChange={e => setContestForm(p => ({ ...p, ends_at: e.target.value }))} />
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>বিবরণ</label>
                  <textarea style={{ ...s.input, minHeight: 80 }} value={contestForm.description}
                    onChange={e => setContestForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div style={s.formActions}>
                  <button onClick={() => setShowContestForm(false)} style={s.cancelBtn}>বাতিল</button>
                  <button onClick={saveContest} style={s.primaryBtn}>কনটেস্ট তৈরি করো</button>
                </div>
              </div>
            )}

            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>কনটেস্ট তালিকা</h3>
                <button onClick={() => setShowContestForm(true)} style={s.primaryBtn}>+ নতুন কনটেস্ট</button>
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>{['নাম', 'Entry Fee', 'শুরু', 'শেষ', 'Status', 'Action'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {contests.map(c => (
                      <tr key={c.id} style={s.tr}>
                        <td style={s.td}><span style={{ fontWeight: 500 }}>{c.title}</span></td>
                        <td style={s.td}>৳{c.entry_fee}</td>
                        <td style={s.td}>{new Date(c.starts_at).toLocaleDateString('bn-BD')}</td>
                        <td style={s.td}>{new Date(c.ends_at).toLocaleDateString('bn-BD')}</td>
                        <td style={s.td}>
                          <span style={
                            c.status === 'active' ? s.tagActive :
                            c.status === 'completed' ? s.tagComplete :
                            c.status === 'judging' ? s.tagWriter : s.tagPending
                          }>{c.status}</span>
                        </td>
                        <td style={s.td}>
                          <select value={c.status} onChange={e => updateContestStatus(c.id, e.target.value)} style={s.selectSmall}>
                            <option value="upcoming">upcoming</option>
                            <option value="active">active</option>
                            <option value="judging">judging</option>
                            <option value="completed">completed</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {contests.length === 0 && (
                  <div style={s.tableEmpty}>
                    <p>এখনো কোনো কনটেস্ট নেই।</p>
                    <button onClick={() => setShowContestForm(true)} style={s.primaryBtn}>+ প্রথম কনটেস্ট তৈরি করো</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
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
  headerInner: { maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: 600, color: '#11181c', margin: 0 },
  headerSub: { fontSize: 13, color: '#687076', margin: '3px 0 0' },
  alertBadge: { padding: '8px 14px', borderRadius: 8, background: '#fff8e1', border: '1px solid #ffe082', color: '#f57c00', fontSize: 13, fontWeight: 500 },
  tabBar: { background: '#fff', borderBottom: '1px solid #e8eaed' },
  tabInner: { maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: 0, overflowX: 'auto' },
  tab: { padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#687076', borderBottom: '2px solid transparent', whiteSpace: 'nowrap' },
  tabActive: { padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#11181c', fontWeight: 500, borderBottom: '2px solid #11181c', whiteSpace: 'nowrap' },
  content: { maxWidth: 1200, margin: '0 auto', padding: '1.5rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: '1.5rem' },
  statCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14 },
  statIcon: { fontSize: 28 },
  statLabel: { fontSize: 12, color: '#687076', margin: 0 },
  statValue: { fontSize: 22, fontWeight: 600, color: '#11181c', margin: '2px 0 0' },
  alertCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '14px 16px', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 },
  alertBtn: { padding: '7px 14px', borderRadius: 7, background: '#f57c00', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 },
  card: { background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', padding: '1.25rem', marginBottom: 12 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#11181c', margin: '0 0 1rem' },
  listRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f3f4' },
  userAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, color: '#11181c', flexShrink: 0 },
  rowTitle: { fontSize: 13, fontWeight: 500, color: '#11181c', margin: 0 },
  rowSub: { fontSize: 12, color: '#687076', margin: '2px 0 0' },
  pendingSection: { background: '#fff8e1', borderRadius: 10, border: '1px solid #ffe082', padding: '1.25rem', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#f57c00', margin: '0 0 1rem' },
  revenueTag: { fontSize: 13, fontWeight: 600, color: '#2e7d32', background: '#e8f5e9', padding: '4px 12px', borderRadius: 20 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#687076', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid #e8eaed', textAlign: 'left', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f1f3f4' },
  td: { padding: '12px 12px', fontSize: 13, color: '#11181c', verticalAlign: 'middle' },
  tableEmpty: { textAlign: 'center', padding: '3rem', color: '#687076' },
  code: { fontFamily: 'monospace', fontSize: 12, background: '#f1f3f4', padding: '2px 6px', borderRadius: 4 },
  selectSmall: { padding: '5px 8px', borderRadius: 6, border: '1px solid #e8eaed', fontSize: 12, background: '#fff', cursor: 'pointer' },
  primaryBtn: { padding: '8px 16px', borderRadius: 7, background: '#11181c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  cancelBtn: { padding: '8px 16px', borderRadius: 7, background: '#fff', color: '#687076', border: '1px solid #e8eaed', cursor: 'pointer', fontSize: 13 },
  actionBtn: { padding: '5px 12px', borderRadius: 6, border: '1px solid #e8eaed', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#11181c' },
  featuredBtn: { padding: '5px 12px', borderRadius: 6, border: '1px solid #ffe082', background: '#fff8e1', cursor: 'pointer', fontSize: 12, color: '#f57c00', fontWeight: 500 },
  activateBtn: { padding: '5px 12px', borderRadius: 6, border: 'none', background: '#e8f5e9', cursor: 'pointer', fontSize: 12, color: '#2e7d32', fontWeight: 500 },
  rejectBtn: { padding: '5px 12px', borderRadius: 6, border: 'none', background: '#fce4ec', cursor: 'pointer', fontSize: 12, color: '#c62828', fontWeight: 500 },
  formCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', padding: '1.5rem', marginBottom: '1.5rem' },
  formTitle: { fontSize: 16, fontWeight: 600, color: '#11181c', marginBottom: '1.25rem' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
  formGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: 500, color: '#11181c', marginBottom: 6, display: 'block' },
  input: { width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #e8eaed', fontSize: 13, outline: 'none', color: '#11181c', background: '#fff', boxSizing: 'border-box' },
  formActions: { display: 'flex', gap: 8, justifyContent: 'flex-end' },
  genreTag: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f1f3f4', color: '#687076' },
  tagActive: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#e8f5e9', color: '#2e7d32', fontWeight: 500 },
  tagInactive: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f1f3f4', color: '#687076', fontWeight: 500 },
  tagPending: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#fff8e1', color: '#f57c00', fontWeight: 500 },
  tagOngoing: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#e8f5e9', color: '#2e7d32', fontWeight: 500 },
  tagComplete: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#e3f2fd', color: '#1565c0', fontWeight: 500 },
  tagAdmin: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#fce4ec', color: '#c62828', fontWeight: 500 },
  tagWriter: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#ede7f6', color: '#4527a0', fontWeight: 500 },
  tagReader: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f1f3f4', color: '#687076', fontWeight: 500 },
}
