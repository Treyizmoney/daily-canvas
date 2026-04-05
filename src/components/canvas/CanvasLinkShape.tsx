import { useState, useEffect, useCallback } from 'react'
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  type TLResizeInfo,
  resizeBox,
} from '@tldraw/editor'
import type { TLBaseShape } from '@tldraw/tlschema'
import { storage } from '@/lib/storage'
import type { CanvasMeta } from '@/types/canvas'

export type CanvasLinkShape = TLBaseShape<
  'canvas-link',
  {
    w: number
    h: number
    targetCanvasId: string
    targetTitle: string
    targetType: string
  }
>

function CanvasLinkContent({
  shape,
  isEditing,
  onUpdate,
  onNavigate,
}: {
  shape: CanvasLinkShape
  isEditing: boolean
  onUpdate: (props: Partial<CanvasLinkShape['props']>) => void
  onNavigate: (canvasId: string) => void
}) {
  const [canvases, setCanvases] = useState<CanvasMeta[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isEditing) {
      storage.listRecent(30).then(setCanvases).catch(() => {})
    }
  }, [isEditing])

  const filtered = canvases.filter(
    (c) => c.id !== shape.id && c.title.toLowerCase().includes(search.toLowerCase()),
  )

  if (isEditing && !shape.props.targetCanvasId) {
    return (
      <div className="flex flex-col gap-2 p-3 h-full">
        <input
          className="bg-muted border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary"
          placeholder="Search canvases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="flex-1 overflow-auto flex flex-col gap-1">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onUpdate({
                  targetCanvasId: c.id,
                  targetTitle: c.title,
                  targetType: c.type,
                })
              }}
              className="text-left px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors flex items-center gap-2"
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                c.type === 'project' ? 'bg-blue-500' :
                c.type === 'topic' ? 'bg-emerald-500' : 'bg-primary/60'
              }`} />
              <span className="truncate">{c.title}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{c.type}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No canvases found</p>
          )}
        </div>
      </div>
    )
  }

  const typeColor = shape.props.targetType === 'project' ? 'bg-blue-500' :
    shape.props.targetType === 'topic' ? 'bg-emerald-500' : 'bg-primary/60'

  return (
    <button
      onClick={() => {
        if (shape.props.targetCanvasId) {
          onNavigate(shape.props.targetCanvasId)
        }
      }}
      className="flex items-center gap-3 w-full h-full p-4 hover:bg-accent/30 transition-colors rounded-lg"
      style={{ pointerEvents: 'all' }}
    >
      <div className={`w-3 h-3 rounded ${typeColor} flex-shrink-0`} />
      <div className="flex flex-col text-left flex-1 min-w-0">
        <span className="text-sm font-medium truncate">
          {shape.props.targetTitle || 'Select a canvas...'}
        </span>
        <span className="text-[10px] text-muted-foreground capitalize">
          {shape.props.targetType || 'canvas'} link
        </span>
      </div>
      <span className="text-lg opacity-40">→</span>
    </button>
  )
}

export class CanvasLinkShapeUtil extends BaseBoxShapeUtil<CanvasLinkShape> {
  static override type = 'canvas-link' as const

  getDefaultProps(): CanvasLinkShape['props'] {
    return {
      w: 280,
      h: 70,
      targetCanvasId: '',
      targetTitle: '',
      targetType: '',
    }
  }

  override canResize = () => true
  override canEdit = () => true

  override onResize(shape: CanvasLinkShape, info: TLResizeInfo<CanvasLinkShape>) {
    return resizeBox(shape, info)
  }

  component(shape: CanvasLinkShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const handleUpdate = useCallback((props: Partial<CanvasLinkShape['props']>) => {
      this.editor.updateShape<CanvasLinkShape>({
        id: shape.id,
        type: 'canvas-link',
        props,
      })
    }, [shape.id])

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const handleNavigate = useCallback((canvasId: string) => {
      // Dispatch custom event that App.tsx listens for
      window.dispatchEvent(new CustomEvent('canvas-navigate', { detail: { canvasId } }))
    }, [])

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
          className="w-full h-full rounded-lg border border-border bg-card shadow-sm overflow-hidden"
        >
          <CanvasLinkContent
            shape={shape}
            isEditing={isEditing}
            onUpdate={handleUpdate}
            onNavigate={handleNavigate}
          />
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: CanvasLinkShape) {
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
