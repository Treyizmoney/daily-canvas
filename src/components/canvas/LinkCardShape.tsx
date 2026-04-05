import {
  BaseBoxShapeUtil,
  HTMLContainer,
  type TLResizeInfo,
  resizeBox,
} from '@tldraw/editor'
import type { TLBaseShape } from '@tldraw/tlschema'

export type LinkCardShape = TLBaseShape<
  'link-card',
  {
    w: number
    h: number
    url: string
    title: string
    description: string
  }
>

export class LinkCardShapeUtil extends BaseBoxShapeUtil<LinkCardShape> {
  static override type = 'link-card' as const

  getDefaultProps(): LinkCardShape['props'] {
    return {
      w: 350,
      h: 120,
      url: '',
      title: 'Link',
      description: '',
    }
  }

  override canResize = () => true
  override canEdit = () => true

  override onResize(shape: LinkCardShape, info: TLResizeInfo<LinkCardShape>) {
    return resizeBox(shape, info)
  }

  component(shape: LinkCardShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          pointerEvents: isEditing ? 'all' : 'none',
          display: 'flex',
          width: shape.props.w,
          height: shape.props.h,
        }}
      >
        <div
          className="flex flex-col h-full rounded-lg border border-border bg-card shadow-sm overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
          style={{ width: '100%', height: '100%' }}
        >
          <div className="px-3 py-2 border-b border-border bg-muted/30 flex-shrink-0">
            <span className="text-xs text-muted-foreground">🔗 Link</span>
          </div>
          <div className="flex-1 p-3 flex flex-col gap-1 overflow-hidden">
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  className="w-full bg-transparent border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary"
                  placeholder="URL..."
                  defaultValue={shape.props.url}
                  autoFocus
                  onChange={(e) => {
                    this.editor.updateShape<LinkCardShape>({
                      id: shape.id,
                      type: 'link-card',
                      props: { url: e.target.value },
                    })
                  }}
                />
                <input
                  className="w-full bg-transparent border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary"
                  placeholder="Title..."
                  defaultValue={shape.props.title}
                  onChange={(e) => {
                    this.editor.updateShape<LinkCardShape>({
                      id: shape.id,
                      type: 'link-card',
                      props: { title: e.target.value },
                    })
                  }}
                />
              </div>
            ) : (
              <>
                <div className="text-sm font-medium truncate">
                  {shape.props.title || 'Untitled Link'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {shape.props.url || 'Double-click to set URL'}
                </div>
                {shape.props.description && (
                  <div className="text-xs text-muted-foreground/70 line-clamp-2 mt-1">
                    {shape.props.description}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: LinkCardShape) {
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
