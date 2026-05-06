/**
 * SaveStatusBadge — shows auto-save state in the toolbar.
 */
export default function SaveStatusBadge({ status, lastSaved }) {
  const configs = {
    idle:    { text: '',             color: 'transparent', dot: false },
    pending: { text: 'পরিবর্তন হয়েছে…', color: '#f59e0b',    dot: true },
    saving:  { text: 'সংরক্ষণ হচ্ছে…', color: '#6366f1',    dot: true },
    saved:   { text: 'সংরক্ষিত ✓',    color: '#22c55e',    dot: false },
    error:   { text: 'ত্রুটি হয়েছে ✗',  color: '#ef4444',    dot: false },
  }
  const cfg = configs[status] || configs.idle
  if (!cfg.text) return null

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 12, color: cfg.color, fontFamily: 'DM Sans, sans-serif',
      transition: 'color 0.3s',
    }}>
      {cfg.dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: cfg.color,
          animation: 'pulse 1.2s ease-in-out infinite',
        }} />
      )}
      {cfg.text}
      {status === 'saved' && lastSaved && (
        <span style={{ color: '#94a3b8', marginLeft: 2 }}>
          {lastSaved.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </span>
  )
}
