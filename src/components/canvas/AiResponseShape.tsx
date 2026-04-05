import {
  BaseBoxShapeUtil,
  HTMLContainer,
  type TLResizeInfo,
  resizeBox,
} from '@tldraw/editor'
import type { TLBaseShape } from '@tldraw/tlschema'

export type AiResponseShape = TLBaseShape<
  'ai-response',
  {
    w: number
    h: number
    prompt: string
    response: string
    isLoading: boolean
    error: string | null
  }
>

export class AiResponseShapeUtil extends BaseBoxShapeUtil<AiResponseShape> {
  static override type = 'ai-response' as const

  getDefaultProps(): AiResponseShape['props'] {
    return {
      w: 450,
      h: 250,
      prompt: '',
      response: '',
      isLoading: false,
      error: null,
    }
  }

  override canResize = () => true

  override onResize(shape: AiResponseShape, info: TLResizeInfo<AiResponseShape>) {
    return resizeBox(shape, info)
  }

  component(shape: AiResponseShape) {
    return (
      <HTMLContainer
        id={shape.id}
        style={{
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          width: shape.props.w,
          height: shape.props.h,
        }}
      >
        <div
          className="flex flex-col h-full rounded-lg border border-primary/30 bg-card shadow-sm overflow-hidden"
          style={{ width: '100%', height: '100%' }}
        >
          <div className="px-3 py-2 border-b border-primary/20 bg-primary/5 flex-shrink-0 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-medium text-primary">AI Response</span>
            {shape.props.isLoading && (
              <span className="text-xs text-muted-foreground animate-pulse">thinking...</span>
            )}
          </div>
          {shape.props.prompt && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-muted/30">
              <span className="font-medium">Prompt:</span> {shape.props.prompt}
            </div>
          )}
          <div
            className="flex-1 p-3 overflow-auto text-sm text-foreground"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {shape.props.error ? (
              <div className="text-destructive text-xs">{shape.props.error}</div>
            ) : (
              shape.props.response || (shape.props.isLoading ? '' : 'No response yet.')
            )}
          </div>
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: AiResponseShape) {
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
