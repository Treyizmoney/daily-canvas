import { useState, useCallback } from 'react'
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  type TLResizeInfo,
  resizeBox,
} from '@tldraw/editor'
import type { TLBaseShape } from '@tldraw/tlschema'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export type PdfEmbedShape = TLBaseShape<
  'pdf-embed',
  {
    w: number
    h: number
    filePath: string
    currentPage: number
    totalPages: number
  }
>

function PdfViewer({
  shape,
  isEditing,
  onUpdate,
}: {
  shape: PdfEmbedShape
  isEditing: boolean
  onUpdate: (props: Partial<PdfEmbedShape['props']>) => void
}) {
  const [numPages, setNumPages] = useState<number>(0)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    onUpdate({ totalPages: numPages })
  }, [onUpdate])

  const goToPrev = useCallback(() => {
    if (shape.props.currentPage > 1) {
      onUpdate({ currentPage: shape.props.currentPage - 1 })
    }
  }, [shape.props.currentPage, onUpdate])

  const goToNext = useCallback(() => {
    if (shape.props.currentPage < numPages) {
      onUpdate({ currentPage: shape.props.currentPage + 1 })
    }
  }, [shape.props.currentPage, numPages, onUpdate])

  if (!shape.props.filePath) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        {isEditing ? (
          <div className="flex flex-col items-center gap-2">
            <span>Enter PDF file path:</span>
            <input
              className="bg-muted border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary w-64"
              placeholder="/path/to/file.pdf"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onUpdate({ filePath: (e.target as HTMLInputElement).value })
                }
              }}
            />
          </div>
        ) : (
          'Double-click to set PDF path'
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF navigation bar */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-muted/30 flex-shrink-0"
        style={{ pointerEvents: 'all' }}
      >
        <button onClick={goToPrev} disabled={shape.props.currentPage <= 1}
          className="p-1 rounded hover:bg-accent disabled:opacity-30">
          <ChevronLeft className="h-3 w-3" />
        </button>
        <span className="text-xs text-muted-foreground">
          {shape.props.currentPage} / {numPages || '...'}
        </span>
        <button onClick={goToNext} disabled={shape.props.currentPage >= numPages}
          className="p-1 rounded hover:bg-accent disabled:opacity-30">
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      {/* PDF page */}
      <div className="flex-1 overflow-auto flex justify-center bg-muted/20">
        <Document
          file={shape.props.filePath}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="p-4 text-xs text-muted-foreground">Loading PDF...</div>}
          error={<div className="p-4 text-xs text-destructive">Failed to load PDF</div>}
        >
          <Page
            pageNumber={shape.props.currentPage}
            width={shape.props.w - 20}
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
      </div>
    </div>
  )
}

export class PdfEmbedShapeUtil extends BaseBoxShapeUtil<PdfEmbedShape> {
  static override type = 'pdf-embed' as const

  getDefaultProps(): PdfEmbedShape['props'] {
    return {
      w: 500,
      h: 650,
      filePath: '',
      currentPage: 1,
      totalPages: 0,
    }
  }

  override canResize = () => true
  override canEdit = () => true

  override onResize(shape: PdfEmbedShape, info: TLResizeInfo<PdfEmbedShape>) {
    return resizeBox(shape, info)
  }

  component(shape: PdfEmbedShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const handleUpdate = useCallback((props: Partial<PdfEmbedShape['props']>) => {
      this.editor.updateShape<PdfEmbedShape>({
        id: shape.id,
        type: 'pdf-embed',
        props,
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
          <div className="px-3 py-2 border-b border-border bg-muted/50 flex-shrink-0 flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              📄 {shape.props.filePath ? shape.props.filePath.split('/').pop() : 'PDF'}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PdfViewer shape={shape} isEditing={isEditing} onUpdate={handleUpdate} />
          </div>
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: PdfEmbedShape) {
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
