import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  fetchNovelsByWriter,
  fetchChaptersByNovel,
  fetchChapterById,
  updateChapter,
  calcWordCount,
} from '../lib/chapters'
import { useAutoSave } from '../hooks/useAutoSave'
import ChapterSidebar from '../components/editor/ChapterSidebar'
import ChapterEditor from '../components/editor/ChapterEditor'
import EditorToolbar from '../components/editor/EditorToolbar'

export default function ChapterEditorPage() {
  const { user, isWriter, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // ── State ──────────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('novelist-dark') === 'true'
  )
  const [novels, setNovels] = useState([])
  const [selectedNovelId, setSelectedNovelId] = useState(null)
  const [chapters, setChapters] = useState([])
  const [selectedChapter, setSelectedChapter] = useState(null)

  const [editorData, setEditorData] = useState(null)
  const [chapterTitle, setChapterTitle] = useState('')
  const [isFree, setIsFree] = useState(true)
  const [wordCount, setWordCount] = useState(0)

  const [novelsLoading, setNovelsLoading] = useState(false)
  const [chaptersLoading, setChaptersLoading] = useState(false)
  const [chapterLoading, setChapterLoading] = useState(false)

  // ── Dark mode persistence ─────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('novelist-dark', darkMode)
    document.body.style.background = darkMode ? '#13151c' : '#fff'
  }, [darkMode])

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isWriter) navigate('/')
  }, [authLoading, isWriter, navigate])

  // ── Load novels on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    setNovelsLoading(true)
    fetchNovelsByWriter(user.id)
      .then(setNovels)
      .catch(console.error)
      .finally(() => setNovelsLoading(false))
  }, [user])

  // ── Load chapters when novel changes ──────────────────────────────────────
  useEffect(() => {
    if (!selectedNovelId) { setChapters([]); return }
    setChaptersLoading(true)
    fetchChaptersByNovel(selectedNovelId)
      .then(setChapters)
      .catch(console.error)
      .finally(() => setChaptersLoading(false))
  }, [selectedNovelId])

  // ── Load chapter content when selection changes ───────────────────────────
  useEffect(() => {
    if (!selectedChapter) {
      setEditorData(null)
      setChapterTitle('')
      setWordCount(0)
      return
    }

    setChapterLoading(true)
    fetchChapterById(selectedChapter.id)
      .then((full) => {
        setChapterTitle(full.title || '')
        setIsFree(full.is_free ?? true)
        setWordCount(full.word_count || 0)

        // Parse stringified Editor.js JSON from DB
        let parsed = { time: Date.now(), blocks: [], version: '2.29.1' }
        if (full.content && typeof full.content === 'string' && full.content.trim() !== '') {
          try {
            const attempt = JSON.parse(full.content)
            if (attempt && Array.isArray(attempt.blocks)) {
              parsed = attempt
            }
          } catch {
            console.warn('[Editor] Invalid JSON in chapters.content — starting blank')
          }
        }

        setEditorData({ ...parsed, time: Date.now() })
      })
      .catch((err) => {
        console.error(err)
        alert('অধ্যায় লোড করা যায়নি।')
      })
      .finally(() => setChapterLoading(false))
  }, [selectedChapter?.id])

  // ── Save function ─────────────────────────────────────────────────────────
  // ✅ useCallback সবসময় top-level এ থাকবে — কখনো .then() বা if-এর ভেতরে না
  const saveChapter = useCallback(
    async ({ data, title, free }) => {
      if (!selectedChapter) return

      // Empty blocks হলে save করবে না
      if (!data || !data.blocks || data.blocks.length === 0) return

      const wc = calcWordCount(data)
      const contentStr = JSON.stringify(data)

      await updateChapter(selectedChapter.id, {
        title,
        content: contentStr,
        is_free: free,
        word_count: wc,
      })

      setWordCount(wc)
      setChapters(prev =>
        prev.map(ch =>
          ch.id === selectedChapter.id
            ? { ...ch, title, word_count: wc, is_free: free }
            : ch
        )
      )
    },
    [selectedChapter]
  )

  const { trigger, forceSave, saveStatus, lastSaved } = useAutoSave(saveChapter, 5000)

  // Latest values ref so forceSave always uses current data
  const latestRef = useRef({ editorData, chapterTitle, isFree })
  useEffect(() => {
    latestRef.current = { editorData, chapterTitle, isFree }
  }, [editorData, chapterTitle, isFree])

  // ── Handle editor content changes ─────────────────────────────────────────
  const handleEditorChange = useCallback(
    (data) => {
      setEditorData(data)
      setWordCount(calcWordCount(data))
      trigger({ data, title: latestRef.current.chapterTitle, free: latestRef.current.isFree })
    },
    [trigger]
  )

  // ── Handle title / isFree changes ────────────────────────────────────────
  const handleTitleChange = useCallback(
    (val) => {
      setChapterTitle(val)
      trigger({ data: latestRef.current.editorData, title: val, free: latestRef.current.isFree })
    },
    [trigger]
  )

  const handleIsFreeChange = useCallback(
    (val) => {
      setIsFree(val)
      trigger({ data: latestRef.current.editorData, title: latestRef.current.chapterTitle, free: val })
    },
    [trigger]
  )

  // ── Ctrl+S keyboard shortcut ──────────────────────────────────────────────
  useEffect(() => {
    const handler = async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        const { editorData: d, chapterTitle: t, isFree: f } = latestRef.current
        if (!d) return
        const liveData = window.__novelistEditorSave
          ? await window.__novelistEditorSave()
          : d
        await forceSave({ data: liveData || d, title: t, free: f })
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [forceSave])

  const handleForceSave = async () => {
    const { editorData: d, chapterTitle: t, isFree: f } = latestRef.current
    if (!d) return
    const liveData = window.__novelistEditorSave
      ? await window.__novelistEditorSave()
      : d
    await forceSave({ data: liveData || d, title: t, free: f })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const d = darkMode

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: d ? '#13151c' : '#fff' }}>
        <p style={{ color: d ? '#6b7280' : '#9ca3af', fontFamily: 'DM Sans, sans-serif' }}>লোড হচ্ছে…</p>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: 'DM Sans, sans-serif',
      background: d ? '#13151c' : '#fff',
    }}>

      {/* Sidebar */}
      <ChapterSidebar
        novels={novels}
        selectedNovelId={selectedNovelId}
        onSelectNovel={id => {
          setSelectedNovelId(id)
          setSelectedChapter(null)
        }}
        chapters={chapters}
        selectedChapterId={selectedChapter?.id}
        onSelectChapter={ch => setSelectedChapter(ch)}
        onChaptersChange={() => {
          if (selectedNovelId) fetchChaptersByNovel(selectedNovelId).then(setChapters)
        }}
        darkMode={darkMode}
      />

      {/* Main Editor Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedChapter ? (
          <>
            <EditorToolbar
              title={chapterTitle}
              onTitleChange={handleTitleChange}
              wordCount={wordCount}
              isFree={isFree}
              onIsFreeChange={handleIsFreeChange}
              onForceSave={handleForceSave}
              saveStatus={saveStatus}
              lastSaved={lastSaved}
              darkMode={darkMode}
              onDarkModeToggle={() => setDarkMode(v => !v)}
            />

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '40px 0',
              background: d ? '#13151c' : '#fff',
            }}>
              {chapterLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: d ? '#4b5563' : '#9ca3af' }}>
                  লোড হচ্ছে…
                </div>
              ) : (
                <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: d ? '#6b7280' : '#9ca3af',
                    textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 24,
                  }}>
                    অধ্যায় {selectedChapter.chapter_number}
                  </div>

                  {editorData && editorData.blocks !== undefined && (
                    <ChapterEditor
                      key={selectedChapter.id}
                      data={editorData}
                      onChange={handleEditorChange}
                      darkMode={darkMode}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <EmptyState
            hasNovel={!!selectedNovelId}
            hasNovels={novels.length > 0}
            darkMode={darkMode}
            onDarkModeToggle={() => setDarkMode(v => !v)}
          />
        )}
      </div>
    </div>
  )
}

function EmptyState({ hasNovel, hasNovels, darkMode, onDarkModeToggle }) {
  const d = darkMode
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: d ? '#13151c' : '#fff',
      gap: 12,
      position: 'relative',
    }}>
      <button
        onClick={onDarkModeToggle}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 20,
        }}
      >
        {d ? '☀️' : '🌙'}
      </button>

      <div style={{ fontSize: 48 }}>✍️</div>
      <h2 style={{
        fontSize: 22, fontWeight: 600, margin: 0,
        color: d ? '#e2e8f0' : '#111827',
        fontFamily: 'Lora, serif',
      }}>
        {!hasNovels ? 'কোনো বই নেই' : !hasNovel ? 'বই বেছে নিন' : 'অধ্যায় বেছে নিন'}
      </h2>
      <p style={{ fontSize: 14, color: d ? '#6b7280' : '#9ca3af', margin: 0 }}>
        {!hasNovels
          ? 'প্রথমে Writer Dashboard থেকে একটি বই তৈরি করুন।'
          : !hasNovel
            ? 'বাম পাশ থেকে একটি বই সিলেক্ট করুন।'
            : '"+ নতুন অধ্যায়" বাটনে ক্লিক করুন বা একটি অধ্যায় বেছে নিন।'}
      </p>
    </div>
  )
}
