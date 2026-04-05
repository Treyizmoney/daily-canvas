import { useState, useCallback, useEffect, useRef } from 'react'
import { storage } from '@/lib/storage'
import type { CanvasMeta } from '@/types/canvas'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  onOpenCanvas: (id: string) => void
}

export function SearchBar({ onOpenCanvas }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CanvasMeta[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    try {
      const found = await storage.searchCanvases(q)
      setResults(found)
      setSelectedIndex(0)
    } catch {
      setResults([])
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 200)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  // Global Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      onOpenCanvas(results[selectedIndex].id)
      setIsOpen(false)
      setQuery('')
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-accent text-sm text-muted-foreground transition-colors w-full max-w-sm"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search canvases...</span>
        <kbd className="ml-auto text-[10px] border border-border rounded px-1 py-0.5 bg-card">
          Ctrl+K
        </kbd>
      </button>
    )
  }

  return (
    <div className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary bg-card">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay to allow click on results
            setTimeout(() => { setIsOpen(false); setQuery('') }, 200)
          }}
          placeholder="Search canvases..."
          className="flex-1 bg-transparent border-none outline-none text-sm"
        />
        <button onClick={() => { setIsOpen(false); setQuery('') }}>
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
          {results.map((canvas, i) => (
            <button
              key={canvas.id}
              onClick={() => {
                onOpenCanvas(canvas.id)
                setIsOpen(false)
                setQuery('')
              }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors ${
                i === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
              <span className="flex-1 truncate">{canvas.title}</span>
              <span className="text-xs text-muted-foreground">{canvas.type}</span>
            </button>
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 px-3 py-4 text-center text-sm text-muted-foreground">
          No canvases found
        </div>
      )}
    </div>
  )
}
