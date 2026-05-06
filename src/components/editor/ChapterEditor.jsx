import { useEffect, useRef } from 'react'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import CodeTool from '@editorjs/code'
import Paragraph from '@editorjs/paragraph'

export default function ChapterEditor({
  data,
  onChange,
  readOnly = false,
  placeholder = 'এখানে লিখুন... "/" টাইপ করুন কমান্ডের জন্য',
}) {
  const holderRef = useRef(null)
  const editorRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const isReadyRef = useRef(false)

  // Always keep onChange callback current
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  useEffect(() => {
    if (!holderRef.current) return

    let destroyed = false
    let editorInstance = null

    const editor = new EditorJS({
      holder: holderRef.current,
      placeholder,
      readOnly,
      autofocus: !readOnly,
      minHeight: 300,
      data: data ?? { time: Date.now(), blocks: [], version: '2.29.1' },

      tools: {
        paragraph: {
          class: Paragraph,
          inlineToolbar: true,
        },
        header: {
          class: Header,
          inlineToolbar: true,
          config: {
            placeholder: 'শিরোনাম',
            levels: [1, 2, 3],
            defaultLevel: 2,
          },
          shortcut: 'CMD+SHIFT+H',
        },
        list: {
          class: List,
          inlineToolbar: true,
          config: { defaultStyle: 'unordered' },
          shortcut: 'CMD+SHIFT+L',
        },
        code: {
          class: CodeTool,
          config: { placeholder: 'কোড এখানে লিখুন' },
          shortcut: 'CMD+SHIFT+C',
        },
      },

      onReady: () => {
        if (destroyed) {
          try { editor.destroy() } catch (_) {}
          return
        }
        editorInstance = editor
        editorRef.current = editor
        isReadyRef.current = true

        window.__novelistEditorSave = async () => {
          try { return await editorRef.current?.save() } catch (_) { return null }
        }
      },

      onChange: async () => {
        if (!isReadyRef.current || destroyed) return
        try {
          const saved = await editorRef.current?.save()
          if (!saved) return

          // Empty blocks হলে save trigger করবে না
          if (!saved.blocks || saved.blocks.length === 0) return

          onChangeRef.current(saved)
        } catch (err) {
          console.error('[Editor] onChange error:', err)
        }
      },

      i18n: {
        messages: {
          toolNames: {
            Text: 'প্যারাগ্রাফ',
            Heading: 'শিরোনাম',
            List: 'তালিকা',
            Code: 'কোড',
          },
          ui: {
            blockTunes: { toggler: { 'Click to tune': 'টিউন করুন', 'or drag to move': 'বা টেনে সরান' } },
            inlineToolbar: { converter: { 'Convert to': 'রূপান্তর করুন' } },
            toolbar: { toolbox: { Add: 'যোগ করুন' } },
          },
        },
      },
    })

    return () => {
      destroyed = true
      isReadyRef.current = false
      editorRef.current = null

      if (editorInstance) {
        try { editorInstance.destroy() } catch (_) {}
      } else {
        editor.isReady
          .then(() => { try { editor.destroy() } catch (_) {} })
          .catch(() => {})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.time])

  return (
    <div
      ref={holderRef}
      className="novelist-editor"
      style={{ minHeight: 400, outline: 'none' }}
    />
  )
}
