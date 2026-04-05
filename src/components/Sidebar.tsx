import { useState, useEffect, useCallback } from 'react'
import { storage } from '@/lib/storage'
import type { CanvasMeta } from '@/types/canvas'
import {
  PanelLeftClose,
  PanelLeft,
  Calendar,
  FolderOpen,
  BookOpen,
  Trash2,
  Pencil,
  Sun,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  activeCanvasId: string | null
  onOpenCanvas: (id: string) => void
  onOpenDay: (date: string) => void
  onGoHome: () => void
  onDeleteCanvas: (id: string) => void
  onRenameCanvas: (id: string, newTitle: string) => void
  onDuplicateCanvas: (id: string) => void
}

export function Sidebar({
  isOpen,
  onToggle,
  activeCanvasId,
  onOpenCanvas,
  onOpenDay,
  onGoHome,
  onDeleteCanvas,
  onRenameCanvas,
  onDuplicateCanvas,
}: SidebarProps) {
  const [dayCanvases, setDayCanvases] = useState<CanvasMeta[]>([])
  const [projectCanvases, setProjectCanvases] = useState<CanvasMeta[]>([])
  const [topicCanvases, setTopicCanvases] = useState<CanvasMeta[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const loadCanvases = useCallback(async () => {
    try {
      const recent = await storage.listRecent(50)
      setDayCanvases(recent.filter((c) => c.type === 'day').slice(0, 7))
      setProjectCanvases(recent.filter((c) => c.type === 'project'))
      setTopicCanvases(recent.filter((c) => c.type === 'topic'))
    } catch {
      // Not available
    }
  }, [])

  useEffect(() => {
    loadCanvases()
  }, [loadCanvases, activeCanvasId])

  const startRename = (canvas: CanvasMeta) => {
    setEditingId(canvas.id)
    setEditTitle(canvas.title)
  }

  const finishRename = () => {
    if (editingId && editTitle.trim()) {
      onRenameCanvas(editingId, editTitle.trim())
    }
    setEditingId(null)
  }

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center py-2 px-1 border-r border-border bg-card/50 w-10">
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7">
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-56 border-r border-border bg-card/50 overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <button onClick={onGoHome} className="text-xs font-semibold tracking-tight hover:text-primary transition-colors">
          Daily Canvas
        </button>
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6">
          <PanelLeftClose className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Today button */}
      <div className="px-2 py-2">
        <button
          onClick={() => {
            const today = new Date().toISOString().split('T')[0]
            onOpenDay(today)
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors text-xs font-medium"
        >
          <Sun className="h-3.5 w-3.5 text-primary" />
          Open Today
        </button>
      </div>

      <div className="flex-1 overflow-auto py-2">
        {/* Recent Days */}
        <SidebarSection icon={Calendar} title="Recent Days">
          {dayCanvases.map((c) => (
            <SidebarItem
              key={c.id}
              label={c.date || c.title}
              isActive={c.id === activeCanvasId}
              onClick={() => onOpenDay(c.date!)}
            />
          ))}
          {dayCanvases.length === 0 && (
            <p className="text-[10px] text-muted-foreground/60 px-3 py-1">No days yet</p>
          )}
        </SidebarSection>

        {/* Projects */}
        <SidebarSection icon={FolderOpen} title="Projects">
          {projectCanvases.map((c) => (
            <SidebarItem
              key={c.id}
              label={editingId === c.id ? undefined : c.title}
              isActive={c.id === activeCanvasId}
              onClick={() => onOpenCanvas(c.id)}
              onDelete={() => onDeleteCanvas(c.id)}
              onRename={() => startRename(c)}
              onDuplicate={() => onDuplicateCanvas(c.id)}
              editMode={editingId === c.id}
              editValue={editTitle}
              onEditChange={setEditTitle}
              onEditSubmit={finishRename}
            />
          ))}
          {projectCanvases.length === 0 && (
            <p className="text-[10px] text-muted-foreground/60 px-3 py-1">No projects yet</p>
          )}
        </SidebarSection>

        {/* Topics */}
        <SidebarSection icon={BookOpen} title="Topics">
          {topicCanvases.map((c) => (
            <SidebarItem
              key={c.id}
              label={editingId === c.id ? undefined : c.title}
              isActive={c.id === activeCanvasId}
              onClick={() => onOpenCanvas(c.id)}
              onDelete={() => onDeleteCanvas(c.id)}
              onRename={() => startRename(c)}
              onDuplicate={() => onDuplicateCanvas(c.id)}
              editMode={editingId === c.id}
              editValue={editTitle}
              onEditChange={setEditTitle}
              onEditSubmit={finishRename}
            />
          ))}
          {topicCanvases.length === 0 && (
            <p className="text-[10px] text-muted-foreground/60 px-3 py-1">No topics yet</p>
          )}
        </SidebarSection>
      </div>
    </div>
  )
}

function SidebarSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 px-3 py-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function SidebarItem({
  label,
  isActive,
  onClick,
  onDelete,
  onRename,
  onDuplicate,
  editMode,
  editValue,
  onEditChange,
  onEditSubmit,
}: {
  label?: string
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
  onRename?: () => void
  onDuplicate?: () => void
  editMode?: boolean
  editValue?: string
  onEditChange?: (v: string) => void
  onEditSubmit?: () => void
}) {
  const [showActions, setShowActions] = useState(false)

  if (editMode) {
    return (
      <div className="px-2">
        <input
          className="w-full px-2 py-1 text-xs bg-muted border border-primary rounded outline-none"
          value={editValue}
          onChange={(e) => onEditChange?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditSubmit?.()
            if (e.key === 'Escape') onEditSubmit?.()
          }}
          onBlur={onEditSubmit}
          autoFocus
        />
      </div>
    )
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left px-3 py-1 text-xs truncate transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-foreground/80 hover:bg-accent/50',
        )}
      >
        {label}
      </button>
      {showActions && (onDelete || onRename || onDuplicate) && (
        <div className="absolute right-1 top-0.5 flex items-center gap-0.5">
          {onDuplicate && (
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate() }}
              className="p-0.5 rounded hover:bg-muted"
              title="Duplicate"
            >
              <Copy className="h-2.5 w-2.5 text-muted-foreground" />
            </button>
          )}
          {onRename && (
            <button
              onClick={(e) => { e.stopPropagation(); onRename() }}
              className="p-0.5 rounded hover:bg-muted"
              title="Rename"
            >
              <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-0.5 rounded hover:bg-destructive/20"
            >
              <Trash2 className="h-2.5 w-2.5 text-destructive" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
