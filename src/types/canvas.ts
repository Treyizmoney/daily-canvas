export interface CanvasMeta {
  id: string
  title: string
  type: 'day' | 'project' | 'topic'
  date: string | null
  created_at: string
  modified_at: string
  tags: string[]
}

export interface CanvasData {
  meta: CanvasMeta
  tldraw_state: Record<string, unknown>
}

export type View = 'calendar' | 'canvas'

export interface AppState {
  currentView: View
  selectedDate: string // ISO date string
  activeCanvasId: string | null
}
