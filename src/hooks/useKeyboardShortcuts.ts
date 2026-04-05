import { useEffect } from 'react'

interface ShortcutHandlers {
  onNewNote?: () => void
  onAskAi?: () => void
  onGoBack?: () => void
  onNavigatePrev?: () => void
  onNavigateNext?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Only allow Escape to bubble
        if (e.key !== 'Escape') return
      }

      // Ctrl/Cmd + N = New note
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handlers.onNewNote?.()
      }

      // Ctrl/Cmd + / = Ask AI
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        handlers.onAskAi?.()
      }

      // Escape = Go back
      if (e.key === 'Escape') {
        handlers.onGoBack?.()
      }

      // Alt + Left = Previous day/week
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        handlers.onNavigatePrev?.()
      }

      // Alt + Right = Next day/week
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        handlers.onNavigateNext?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
