import { createShapeId, type Editor } from '@tldraw/editor'
import type { NoteBlockShape } from '@/components/canvas/NoteBlockShape'

/**
 * Populates a fresh day canvas with default layout:
 * - Journal block (center-left, large)
 * - "Today" header label
 * - Quick links section placeholder
 */
export function populateDayHub(editor: Editor, dateLabel: string) {
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
      h: 450,
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
      h: 250,
      content: '',
      title: 'Quick Notes',
    },
  })

  // Tasks / working on block — right side, below
  editor.createShape<NoteBlockShape>({
    id: createShapeId(),
    type: 'note-block',
    x: 300,
    y: 200,
    props: {
      w: 350,
      h: 250,
      content: '',
      title: 'Tasks & Working On',
    },
  })
}
