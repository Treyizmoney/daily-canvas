import { useState, useEffect, useCallback } from 'react'
import { WeekView } from '@/components/calendar/WeekView'
import { CanvasWorkspace } from '@/components/canvas/CanvasWorkspace'
import { storage } from '@/lib/storage'
import { toDateString, getWeekDays } from '@/lib/dates'
import type { CanvasData } from '@/types/canvas'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type View = 'calendar' | 'canvas'

export default function App() {
  const [view, setView] = useState<View>('calendar')
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()))
  const [canvasDates, setCanvasDates] = useState<Set<string>>(new Set())
  const [activeCanvas, setActiveCanvas] = useState<CanvasData | null>(null)
  const [recentCanvases, setRecentCanvases] = useState<{ id: string; title: string; type: string }[]>([])

  const refreshWeekData = useCallback(async () => {
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
      // Storage not available (dev mode without Tauri backend)
    }
  }, [selectedDate])

  useEffect(() => {
    refreshWeekData()
  }, [refreshWeekData])

  const openDay = useCallback(async (date: string) => {
    try {
      const canvas = await storage.getOrCreateDayCanvas(date)
      setActiveCanvas(canvas)
      setView('canvas')
      refreshWeekData()
    } catch (err) {
      console.error('Failed to open day canvas:', err)
    }
  }, [refreshWeekData])

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

  const goBack = useCallback(() => {
    setView('calendar')
    setActiveCanvas(null)
    refreshWeekData()
  }, [refreshWeekData])

  if (view === 'canvas' && activeCanvas) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="flex items-center gap-2 px-2 py-1 bg-card border-b border-border">
          <Button variant="ghost" size="icon" onClick={goBack} className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1">
          <CanvasWorkspace
            canvasId={activeCanvas.meta.id}
            meta={activeCanvas.meta}
            initialState={activeCanvas.tldraw_state}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background dark">
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
                      <div className="w-2 h-2 rounded-full bg-primary/60" />
                      <span className="text-sm font-medium">{canvas.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{canvas.type}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
