import { useCallback, useEffect, useRef, useState } from 'react'
import { Tldraw } from 'tldraw'
import { createShapeId, type Editor, type TLShapePartial } from '@tldraw/editor'
import 'tldraw/tldraw.css'
import { NoteBlockShapeUtil, type NoteBlockShape } from './NoteBlockShape'
import { AiResponseShapeUtil, type AiResponseShape } from './AiResponseShape'
import { LinkCardShapeUtil } from './LinkCardShape'
import { PdfEmbedShapeUtil } from './PdfEmbedShape'
import { CanvasLinkShapeUtil } from './CanvasLinkShape'
import { askAi } from '@/lib/ai'
import { populateDayHub } from '@/lib/dayHub'
import { storage } from '@/lib/storage'
import type { CanvasMeta } from '@/types/canvas'
import { Button } from '@/components/ui/button'
import { StickyNote, Link, Sparkles, FileText, ArrowRightLeft } from 'lucide-react'

const customShapeUtils = [NoteBlockShapeUtil, AiResponseShapeUtil, LinkCardShapeUtil, PdfEmbedShapeUtil, CanvasLinkShapeUtil]

interface CanvasWorkspaceProps {
  canvasId: string
  meta: CanvasMeta
  initialState: Record<string, unknown>
  onRename?: (newTitle: string) => void
}

export function CanvasWorkspace({ canvasId, meta, initialState, onRename }: CanvasWorkspaceProps) {
  const editorRef = useRef<Editor | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [showAiInput, setShowAiInput] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(meta.title)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor

    // Load initial state if it has records
    if (initialState && Object.keys(initialState).length > 0) {
      try {
        const snapshot = initialState as Parameters<typeof editor.store.loadStoreSnapshot>[0]
        editor.store.loadStoreSnapshot(snapshot)
      } catch {
        // Empty canvas, that's fine
      }
    }

    // If this is a new day canvas, populate with default layout
    if (meta.type === 'day' && editor.getCurrentPageShapes().length === 0) {
      populateDayHub(editor, meta.title).catch(console.error)
    }
  }, [initialState, meta.type, meta.title])

  // Auto-save on changes (debounced)
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const unsub = editor.store.listen(() => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        const snapshot = editor.store.getStoreSnapshot()
        const now = new Date().toISOString()
        storage.saveCanvas(
          { ...meta, modified_at: now },
          snapshot as unknown as Record<string, unknown>,
        ).catch(console.error)
      }, 1000) // Save 1s after last change
    }, { scope: 'document', source: 'user' })

    return () => {
      unsub()
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [canvasId, meta])

  const addNoteBlock = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const center = editor.getViewportScreenCenter()
    const point = editor.screenToPage(center)

    editor.createShape<NoteBlockShape>({
      id: createShapeId(),
      type: 'note-block',
      x: point.x - 200,
      y: point.y - 150,
      props: {
        w: 400,
        h: 300,
        content: '',
        title: 'Note',
      },
    })
  }, [])

  const addLinkCard = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const center = editor.getViewportScreenCenter()
    const point = editor.screenToPage(center)

    editor.createShape({
      id: createShapeId(),
      type: 'link-card',
      x: point.x - 175,
      y: point.y - 60,
      props: {
        w: 350,
        h: 120,
        url: '',
        title: '',
        description: '',
      },
    })
  }, [])

  const addPdfEmbed = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const center = editor.getViewportScreenCenter()
    const point = editor.screenToPage(center)

    editor.createShape({
      id: createShapeId(),
      type: 'pdf-embed',
      x: point.x - 250,
      y: point.y - 325,
      props: {
        w: 500,
        h: 650,
        filePath: '',
        currentPage: 1,
        totalPages: 0,
      },
    })
  }, [])

  const addCanvasLink = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const center = editor.getViewportScreenCenter()
    const point = editor.screenToPage(center)

    const shapeId = createShapeId()
    editor.createShape({
      id: shapeId,
      type: 'canvas-link',
      x: point.x - 140,
      y: point.y - 35,
      props: {
        w: 280,
        h: 70,
        targetCanvasId: '',
        targetTitle: '',
        targetType: '',
      },
    })
    // Start editing immediately so user can pick a canvas
    editor.setEditingShape(shapeId)
  }, [])

  const triggerAi = useCallback(() => {
    const editor = editorRef.current
    if (!editor || !aiPrompt.trim()) return

    // Get selected shapes' text content for context
    const selectedShapes = editor.getSelectedShapes()
    let context = ''
    for (const shape of selectedShapes) {
      if (shape.type === 'note-block') {
        const noteShape = shape as NoteBlockShape
        context += noteShape.props.content + '\n'
      }
    }

    // Create AI response shape near center
    const center = editor.getViewportScreenCenter()
    const point = editor.screenToPage(center)
    const shapeId = createShapeId()

    editor.createShape<AiResponseShape>({
      id: shapeId,
      type: 'ai-response',
      x: point.x - 225,
      y: point.y - 125,
      props: {
        w: 450,
        h: 250,
        prompt: aiPrompt,
        response: '',
        isLoading: true,
        error: null,
      },
    })

    let fullResponse = ''

    askAi(context, aiPrompt, {
      onToken(token) {
        fullResponse += token
        editor.updateShape<AiResponseShape>({
          id: shapeId,
          type: 'ai-response',
          props: { response: fullResponse },
        } as TLShapePartial<AiResponseShape>)
      },
      onDone() {
        editor.updateShape<AiResponseShape>({
          id: shapeId,
          type: 'ai-response',
          props: { isLoading: false },
        } as TLShapePartial<AiResponseShape>)
      },
      onError(error) {
        editor.updateShape<AiResponseShape>({
          id: shapeId,
          type: 'ai-response',
          props: { isLoading: false, error },
        } as TLShapePartial<AiResponseShape>)
      },
    })

    setAiPrompt('')
    setShowAiInput(false)
  }, [aiPrompt])

  return (
    <div className="flex flex-col h-full">
      {/* Canvas toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/80 backdrop-blur-sm z-10">
        {isEditingTitle ? (
          <input
            className="text-sm font-medium bg-muted border border-primary rounded px-2 py-0.5 outline-none w-48 mr-2"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onRename?.(titleValue)
                setIsEditingTitle(false)
              }
              if (e.key === 'Escape') {
                setTitleValue(meta.title)
                setIsEditingTitle(false)
              }
            }}
            onBlur={() => {
              onRename?.(titleValue)
              setIsEditingTitle(false)
            }}
            autoFocus
          />
        ) : (
          <button
            onClick={() => meta.type !== 'day' && setIsEditingTitle(true)}
            className="text-sm font-medium text-foreground mr-2 hover:text-primary transition-colors"
            title={meta.type !== 'day' ? 'Click to rename' : undefined}
          >
            {meta.title}
          </button>
        )}
        <div className="h-4 w-px bg-border" />
        <Button variant="ghost" size="sm" onClick={addNoteBlock} className="h-7 text-xs gap-1">
          <StickyNote className="h-3 w-3" />
          Note
        </Button>
        <Button variant="ghost" size="sm" onClick={addLinkCard} className="h-7 text-xs gap-1">
          <Link className="h-3 w-3" />
          Link
        </Button>
        <Button variant="ghost" size="sm" onClick={addPdfEmbed} className="h-7 text-xs gap-1">
          <FileText className="h-3 w-3" />
          PDF
        </Button>
        <Button variant="ghost" size="sm" onClick={addCanvasLink} className="h-7 text-xs gap-1">
          <ArrowRightLeft className="h-3 w-3" />
          Canvas Link
        </Button>
        <div className="h-4 w-px bg-border" />
        {showAiInput ? (
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <input
              className="flex-1 bg-muted border border-border rounded-md px-2 py-1 text-xs outline-none focus:border-primary"
              placeholder="Ask AI something..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') triggerAi()
                if (e.key === 'Escape') setShowAiInput(false)
              }}
              autoFocus
            />
            <Button variant="default" size="sm" onClick={triggerAi} className="h-7 text-xs">
              Send
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAiInput(true)}
            className="h-7 text-xs gap-1"
          >
            <Sparkles className="h-3 w-3" />
            Ask AI
          </Button>
        )}
      </div>

      {/* tldraw canvas */}
      <div className="flex-1 relative">
        <Tldraw
          shapeUtils={customShapeUtils}
          onMount={handleMount}
          inferDarkMode
        />
      </div>
    </div>
  )
}
