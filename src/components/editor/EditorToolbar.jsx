import SaveStatusBadge from './SaveStatusBadge'

export default function EditorToolbar({
  title,
  onTitleChange,
  wordCount,
  isFree,
  onIsFreeChange,
  onForceSave,
  saveStatus,
  lastSaved,
  darkMode,
  onDarkModeToggle,
}) {
  const d = darkMode
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 32px',
      height: 56,
      borderBottom: `1px solid ${d ? '#1e2029' : '#e5e7eb'}`,
      background: d ? '#13151c' : '#fff',
      fontFamily: 'DM Sans, sans-serif',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      flexShrink: 0,
    }}>
      {/* Chapter Title */}
      <input
        value={title}
        onChange={e => onTitleChange(e.target.value)}
        placeholder="অধ্যায়ের শিরোনাম"
        maxLength={200}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 15,
          fontWeight: 600,
          color: d ? '#e2e8f0' : '#111827',
          fontFamily: 'Lora, serif',
          minWidth: 0,
        }}
      />

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: d ? '#2a2d3a' : '#e5e7eb' }} />

      {/* Word Count */}
      <span style={{ fontSize: 12, color: d ? '#6b7280' : '#9ca3af', whiteSpace: 'nowrap' }}>
        {wordCount.toLocaleString()} শব্দ
      </span>

      {/* Save Status */}
      <SaveStatusBadge status={saveStatus} lastSaved={lastSaved} />

      {/* Free / Paid toggle */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        fontSize: 12, color: d ? '#9ca3af' : '#6b7280', whiteSpace: 'nowrap',
      }}>
        <input
          type="checkbox"
          checked={isFree}
          onChange={e => onIsFreeChange(e.target.checked)}
          style={{ width: 14, height: 14, accentColor: '#4f46e5', cursor: 'pointer' }}
        />
        ফ্রি
      </label>

      {/* Manual Save (Ctrl+S also works) */}
      <button
        onClick={onForceSave}
        title="সংরক্ষণ করুন (Ctrl+S)"
        style={{
          padding: '6px 14px', borderRadius: 7,
          border: `1px solid ${d ? '#2a2d3a' : '#e5e7eb'}`,
          background: d ? '#1e2230' : '#f9fafb',
          color: d ? '#a5b4fc' : '#4f46e5',
          fontSize: 12, fontWeight: 500, cursor: 'pointer',
          transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}
      >
        💾 সংরক্ষণ
      </button>

      {/* Dark Mode */}
      <button
        onClick={onDarkModeToggle}
        title="ডার্ক মোড"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, lineHeight: 1, padding: '4px',
        }}
      >
        {d ? '☀️' : '🌙'}
      </button>
    </div>
  )
}
