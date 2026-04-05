import {
  BaseBoxShapeUtil,
  HTMLContainer,
  type TLResizeInfo,
  resizeBox,
} from '@tldraw/editor'
import type { TLBaseShape } from '@tldraw/tlschema'

export type NoteBlockShape = TLBaseShape<
  'note-block',
  {
    w: number
    h: number
    content: string
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
          <div
            className="flex-1 p-3 overflow-auto text-sm text-foreground"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {isEditing ? (
              <textarea
                className="w-full h-full bg-transparent border-none outline-none resize-none text-sm"
                defaultValue={shape.props.content}
                autoFocus
                onChange={(e) => {
                  this.editor.updateShape<NoteBlockShape>({
                    id: shape.id,
                    type: 'note-block',
                    props: { content: e.target.value },
                  })
                }}
              />
            ) : (
              <div className="opacity-80">
                {shape.props.content || 'Double-click to edit...'}
              </div>
            )}
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
