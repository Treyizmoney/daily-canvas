import {
  BaseBoxShapeUtil,
  HTMLContainer,
  type TLResizeInfo,
  resizeBox,
} from '@tldraw/editor'
import type { TLBaseShape } from '@tldraw/tlschema'
import { NoteEditor } from '@/components/editor/NoteEditor'
import { useCallback } from 'react'

export type NoteBlockShape = TLBaseShape<
  'note-block',
  {
    w: number
    h: number
    content: string // JSON string of BlockNote blocks
    title: string
  }
>

export class NoteBlockShapeUtil extends BaseBoxShapeUtil<NoteBlockShape> {
  static override type = 'note-block' as const

  getDefaultProps(): NoteBlockShape['props'] {
    return {
      w: 400,
      h: 300,
      content: '',
      title: 'Note',
    }
  }

  override canResize = () => true
  override canEdit = () => true

  override onResize(shape: NoteBlockShape, info: TLResizeInfo<NoteBlockShape>) {
    return resizeBox(shape, info)
  }

  component(shape: NoteBlockShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const handleChange = useCallback((content: string) => {
      this.editor.updateShape<NoteBlockShape>({
        id: shape.id,
        type: 'note-block',
        props: { content },
      })
    }, [shape.id])

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          pointerEvents: isEditing ? 'all' : 'none',
          display: 'flex',
          flexDirection: 'column',
          width: shape.props.w,
          height: shape.props.h,
        }}
      >
        <div
          className="flex flex-col h-full rounded-lg border border-border bg-card shadow-sm overflow-hidden"
          style={{ width: '100%', height: '100%' }}
        >
          <div className="px-3 py-2 border-b border-border bg-muted/50 flex-shrink-0">
            <span className="text-xs font-medium text-muted-foreground">
              {shape.props.title}
            </span>
          </div>
          <div className="flex-1 overflow-auto">
            <NoteEditor
              initialContent={shape.props.content}
              isEditing={isEditing}
              onChange={handleChange}
            />
          </div>
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: NoteBlockShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={8}
        ry={8}
      />
    )
  }
}
