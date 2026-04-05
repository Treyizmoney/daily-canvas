import { invoke } from '@tauri-apps/api/core'
import type { CanvasData, CanvasMeta } from '@/types/canvas'

export const storage = {
  async saveCanvas(meta: CanvasMeta, tldrawState: Record<string, unknown>): Promise<void> {
    await invoke('save_canvas', { meta, tldrawState })
  },

  async loadCanvas(id: string): Promise<CanvasData | null> {
    return invoke('load_canvas', { id })
  },

  async getOrCreateDayCanvas(date: string): Promise<CanvasData> {
    return invoke('get_or_create_day_canvas', { date })
  },

  async createCanvas(title: string, canvasType: string, tags: string[]): Promise<CanvasMeta> {
    return invoke('create_canvas', { title, canvasType, tags })
  },

  async listByDateRange(start: string, end: string): Promise<CanvasMeta[]> {
    return invoke('list_canvases_by_date', { start, end })
  },

  async listRecent(limit: number): Promise<CanvasMeta[]> {
    return invoke('list_recent_canvases', { limit })
  },

  async deleteCanvas(id: string): Promise<void> {
    await invoke('delete_canvas', { id })
  },

  async searchCanvases(query: string): Promise<CanvasMeta[]> {
    return invoke('search_canvases', { query })
  },
}
