import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { useEffect, useRef } from 'react'
import type { Block } from '@blocknote/core'

interface NoteEditorProps {
  initialContent: string // JSON string of blocks, or empty
  isEditing: boolean
  onChange: (content: string) => void
}

export function NoteEditor({ initialContent, isEditing, onChange }: NoteEditorProps) {
  const parsedContent = useRef<Block[] | undefined>(undefined)

  // Parse initial content once
  if (parsedContent.current === undefined && initialContent) {
    try {
      parsedContent.current = JSON.parse(initialContent)
    } catch {
      // If not valid JSON, treat as empty
      parsedContent.current = undefined
    }
  }

  const editor = useCreateBlockNote({
    initialContent: parsedContent.current,
  })

  useEffect(() => {
    if (!editor) return

    const handler = () => {
      const blocks = editor.document
      onChange(JSON.stringify(blocks))
    }

    editor.onEditorContentChange(handler)
  }, [editor, onChange])

  return (
    <div
      className="note-editor h-full"
      style={{ pointerEvents: isEditing ? 'all' : 'none' }}
    >
      <BlockNoteView
        editor={editor}
        editable={isEditing}
        theme="dark"
        data-theming-css-variables-demo
      />
    </div>
  )
}
