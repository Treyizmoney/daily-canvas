import { useState, useEffect, useCallback, useMemo } from 'react'
import { WeekView } from '@/components/calendar/WeekView'
import { CanvasWorkspace } from '@/components/canvas/CanvasWorkspace'
import { Sidebar } from '@/components/Sidebar'
import { storage } from '@/lib/storage'
import { toDateString, getWeekDays, nextWeek, prevWeek, parseISO } from '@/lib/dates'
import type { CanvasData } from '@/types/canvas'
import { Button } from '@/components/ui/button'
import { Settings } from '@/components/Settings'
import { NewCanvasDialog } from '@/components/NewCanvasDialog'
import { SearchBar } from '@/components/SearchBar'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

type View = 'home' | 'canvas'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()))
  const [canvasDates, setCanvasDates] = useState<Set<string>>(new Set())
  const [activeCanvas, setActiveCanvas] = useState<CanvasData | null>(null)
  const [recentCanvases, setRecentCanvases] = useState<{ id: string; title: string; type: string }[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const refreshData = useCallback(async () => {
    try {
      const weekDays = getWeekDays(new Date(selectedDate))
      const start = toDateString(weekDays[0])
      const end = toDateString(weekDays[6])
      const canvases = await storage.listByDateRange(start, end)
      setCanvasDates(new Set(canvases.map((c) => c.date!).filter(Boolean)))

      const recent = await storage.listRecent(10)
      setRecentCanvases(recent.filter((c) => c.type !== 'day').map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
      })))
    } catch {
      // Storage not available
    }
  }, [selectedDate])

  // Listen for canvas-navigate events from CanvasLink shapes
  useEffect(() => {
    const handler = (e: Event) => {
      const { canvasId } = (e as CustomEvent).detail
      openCanvas(canvasId)
    }
    window.addEventListener('canvas-navigate', handler)
    return () => window.removeEventListener('canvas-navigate', handler)
  }, [openCanvas])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const openDay = useCallback(async (date: string) => {
    try {
      const canvas = await storage.getOrCreateDayCanvas(date)
      setActiveCanvas(canvas)
      setSelectedDate(date)
      setView('canvas')
      refreshData()
    } catch (err) {
      console.error('Failed to open day canvas:', err)
    }
  }, [refreshData])

  const openCanvas = useCallback(async (id: string) => {
    try {
      const canvas = await storage.loadCanvas(id)
      if (canvas) {
        setActiveCanvas(canvas)
        setView('canvas')
      }
    } catch (err) {
      console.error('Failed to open canvas:', err)
    }
  }, [])

  const createCanvas = useCallback(async (title: string, type: 'project' | 'topic') => {
    try {
      const meta = await storage.createCanvas(title, type, [])
      const canvas = await storage.loadCanvas(meta.id)
      if (canvas) {
        setActiveCanvas(canvas)
        setView('canvas')
        refreshData()
      }
    } catch (err) {
      console.error('Failed to create canvas:', err)
    }
  }, [refreshData])

  const deleteCanvas = useCallback(async (id: string) => {
    try {
      await storage.deleteCanvas(id)
      if (activeCanvas?.meta.id === id) {
        setActiveCanvas(null)
        setView('home')
      }
      refreshData()
    } catch (err) {
      console.error('Failed to delete canvas:', err)
    }
  }, [activeCanvas, refreshData])

  const renameCanvas = useCallback(async (id: string, newTitle: string) => {
    try {
      await storage.renameCanvas(id, newTitle)
      refreshData()
    } catch (err) {
      console.error('Failed to rename canvas:', err)
    }
  }, [refreshData])

  const goHome = useCallback(() => {
    setView('home')
    setActiveCanvas(null)
    refreshData()
  }, [refreshData])

  // Keyboard shortcuts
  const shortcuts = useMemo(() => ({
    onGoBack: () => {
      if (view === 'canvas') goHome()
    },
    onNavigatePrev: () => {
      if (view === 'home') {
        setSelectedDate(toDateString(prevWeek(parseISO(selectedDate))))
      }
    },
    onNavigateNext: () => {
      if (view === 'home') {
        setSelectedDate(toDateString(nextWeek(parseISO(selectedDate))))
      }
    },
  }), [view, goHome, selectedDate])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="h-full flex bg-background dark">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeCanvasId={activeCanvas?.meta.id ?? null}
        onOpenCanvas={openCanvas}
        onOpenDay={openDay}
        onGoHome={goHome}
        onDeleteCanvas={deleteCanvas}
        onRenameCanvas={renameCanvas}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {view === 'canvas' && activeCanvas ? (
          <CanvasWorkspace
            canvasId={activeCanvas.meta.id}
            meta={activeCanvas.meta}
            initialState={activeCanvas.tldraw_state}
            onRename={(newTitle) => renameCanvas(activeCanvas.meta.id, newTitle)}
          />
        ) : (
          <>
            {/* Home header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
              <h1 className="text-sm font-semibold tracking-tight">Daily Canvas</h1>
              <div className="flex items-center gap-2">
                <SearchBar onOpenCanvas={openCanvas} />
                <NewCanvasDialog onCreateCanvas={createCanvas} />
                <Settings />
              </div>
            </div>

            <WeekView
              selectedDate={selectedDate}
              canvasDates={canvasDates}
              onSelectDate={setSelectedDate}
              onOpenDay={openDay}
            />

            <div className="flex-1 flex flex-col p-6 overflow-auto">
              <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
                {/* Open day button */}
                <button
                  onClick={() => openDay(selectedDate)}
                  className="group w-full p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {canvasDates.has(selectedDate)
                          ? 'Open your canvas for this day'
                          : 'Start a new canvas for this day'}
                      </p>
                    </div>
                    <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                      →
                    </div>
                  </div>
                </button>

                {/* Recent project canvases */}
                {recentCanvases.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Canvases</h4>
                    <div className="flex flex-col gap-2">
                      {recentCanvases.map((canvas) => (
                        <button
                          key={canvas.id}
                          onClick={() => openCanvas(canvas.id)}
                          className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              canvas.type === 'project' ? 'bg-blue-500' : 'bg-emerald-500'
                            }`} />
                            <span className="text-sm font-medium">{canvas.title}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{canvas.type}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recentCanvases.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No project canvases yet.</p>
                    <p className="text-xs mt-1">Click "New Canvas" to create one, or open a day to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
