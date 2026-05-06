import { supabase } from './supabase'

// ─── Chapter Queries ────────────────────────────────────────────────────────

/**
 * Fetch all chapters for a novel, ordered by chapter_number.
 */
export async function fetchChaptersByNovel(novelId) {
  const { data, error } = await supabase
    .from('chapters')
    .select('id, novel_id, chapter_number, title, word_count, is_free, created_at, published_at')
    .eq('novel_id', novelId)
    .order('chapter_number', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Fetch a single chapter including its full content (Editor.js JSON string).
 */
export async function fetchChapterById(chapterId) {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get the next chapter_number for a given novel.
 */
async function getNextChapterNumber(novelId) {
  const { count, error } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true })
    .eq('novel_id', novelId)

  if (error) throw error
  return (count || 0) + 1
}

/**
 * Create a new blank chapter.
 * content is stored as a stringified Editor.js OutputData JSON.
 */
export async function createChapter(novelId, title = 'নতুন অধ্যায়') {
  const chapterNumber = await getNextChapterNumber(novelId)

  const blankContent = JSON.stringify({
    time: Date.now(),
    blocks: [],
    version: '2.29.1',
  })

  const { data, error } = await supabase
    .from('chapters')
    .insert({
      novel_id: novelId,
      chapter_number: chapterNumber,
      title,
      content: blankContent,
      is_free: true,
      word_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update chapter title, content (Editor.js JSON string), word_count, and is_free.
 * Pass only the fields you want to update.
 */
export async function updateChapter(chapterId, fields) {
  const { data, error } = await supabase
    .from('chapters')
    .update({ ...fields, published_at: fields.published_at ?? undefined })
    .eq('id', chapterId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a chapter. After deletion, re-sequences chapter_number for the novel.
 */
export async function deleteChapter(chapterId, novelId) {
  const { error } = await supabase.from('chapters').delete().eq('id', chapterId)
  if (error) throw error

  // Re-sequence remaining chapters
  const remaining = await fetchChaptersByNovel(novelId)
  await Promise.all(
    remaining.map((ch, idx) =>
      supabase
        .from('chapters')
        .update({ chapter_number: idx + 1 })
        .eq('id', ch.id)
    )
  )
}

// ─── Novel Queries ───────────────────────────────────────────────────────────

/**
 * Fetch novels belonging to a writer, with chapter count.
 */
export async function fetchNovelsByWriter(writerId) {
  const { data, error } = await supabase
    .from('novels')
    .select('id, title, status, genre, is_free, total_chapters, created_at')
    .eq('writer_id', writerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ─── Word Count Helper ───────────────────────────────────────────────────────

/**
 * Extract plain text from Editor.js OutputData and count words.
 * Works with paragraph, header, list, and code blocks.
 */
export function calcWordCount(editorData) {
  if (!editorData || !Array.isArray(editorData.blocks)) return 0

  const text = editorData.blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
        case 'header':
          // Strip HTML tags that Editor.js might inject
          return (block.data.text || '').replace(/<[^>]+>/g, '')
        case 'list':
          return (block.data.items || []).join(' ')
        case 'code':
          return block.data.code || ''
        default:
          return ''
      }
    })
    .join(' ')

  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}
