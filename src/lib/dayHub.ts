import { createShapeId, type Editor } from '@tldraw/editor'
import type { NoteBlockShape } from '@/components/canvas/NoteBlockShape'
import type { CanvasLinkShape } from '@/components/canvas/CanvasLinkShape'
import { storage } from '@/lib/storage'

/**
 * Populates a fresh day canvas with default layout:
 * - Journal block (center-left, large)
 * - Quick notes block (right)
 * - Tasks block (right, below)
 * - Canvas links to recent project/topic canvases (below journal)
 */
export async function populateDayHub(editor: Editor, dateLabel: string) {
  // Check if canvas already has shapes (don't re-populate)
  const existingShapes = editor.getCurrentPageShapes()
  if (existingShapes.length > 0) return

  // Journal block — main area, large
  editor.createShape<NoteBlockShape>({
    id: createShapeId(),
    type: 'note-block',
    x: -250,
    y: -100,
    props: {
      w: 500,
      h: 400,
      content: '',
      title: `Journal — ${dateLabel}`,
    },
  })

  // Quick notes / brain dump block — right side
  editor.createShape<NoteBlockShape>({
    id: createShapeId(),
    type: 'note-block',
    x: 300,
    y: -100,
    props: {
      w: 350,
      h: 220,
      content: '',
      title: 'Quick Notes',
    },
  })

  // Tasks / working on block — right side, below
  editor.createShape<NoteBlockShape>({
    id: createShapeId(),
    type: 'note-block',
    x: 300,
    y: 160,
    props: {
      w: 350,
      h: 220,
      content: '',
      title: 'Tasks & Working On',
    },
  })

  // Auto-insert links to recent project/topic canvases
  try {
    const recent = await storage.listRecent(20)
    const projectCanvases = recent.filter((c) => c.type === 'project' || c.type === 'topic').slice(0, 5)

    projectCanvases.forEach((canvas, i) => {
      editor.createShape<CanvasLinkShape>({
        id: createShapeId(),
        type: 'canvas-link',
        x: -250,
        y: 350 + i * 80,
        props: {
          w: 280,
          h: 70,
          targetCanvasId: canvas.id,
          targetTitle: canvas.title,
          targetType: canvas.type,
        },
      })
    })
  } catch {
    // Storage not available
  }
}
