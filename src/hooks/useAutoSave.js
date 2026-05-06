import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useAutoSave — calls `saveFn` at most once every `delay` ms after the last change.
 *
 * Returns:
 *   - trigger(data): call this with the latest data to schedule a save
 *   - saveStatus: 'idle' | 'pending' | 'saving' | 'saved' | 'error'
 *   - lastSaved: Date | null
 *   - forceSave(data): save immediately (e.g. on Ctrl+S)
 */
export function useAutoSave(saveFn, delay = 5000) {
  const [saveStatus, setSaveStatus] = useState('idle')
  const [lastSaved, setLastSaved] = useState(null)
  const timerRef = useRef(null)
  const latestDataRef = useRef(null)
  const saveFnRef = useRef(saveFn)

  // Keep saveFn ref current without re-triggering effects
  useEffect(() => { saveFnRef.current = saveFn }, [saveFn])

  const doSave = useCallback(async (data) => {
    setSaveStatus('saving')
    try {
      await saveFnRef.current(data)
      setLastSaved(new Date())
      setSaveStatus('saved')
      // Revert to idle after 2s so the badge doesn't stay permanently
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('[AutoSave] Error:', err)
      setSaveStatus('error')
    }
  }, [])

  const trigger = useCallback((data) => {
    latestDataRef.current = data
    setSaveStatus('pending')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      doSave(latestDataRef.current)
    }, delay)
  }, [delay, doSave])

  const forceSave = useCallback(async (data) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    await doSave(data ?? latestDataRef.current)
  }, [doSave])

  // Cleanup on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return { trigger, forceSave, saveStatus, lastSaved }
}
