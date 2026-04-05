import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'

interface NewCanvasDialogProps {
  onCreateCanvas: (title: string, type: 'project' | 'topic') => void
}

export function NewCanvasDialog({ onCreateCanvas }: NewCanvasDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'project' | 'topic'>('project')

  const handleCreate = () => {
    if (!title.trim()) return
    onCreateCanvas(title.trim(), type)
    setTitle('')
    setType('project')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New Canvas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Canvas</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. STATS 1342, DayEdge Architecture..."
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setType('project')}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  type === 'project'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent'
                }`}
              >
                <div className="font-medium">Project</div>
                <div className="text-xs opacity-70 mt-0.5">Ongoing work (DayEdge, LLC)</div>
              </button>
              <button
                onClick={() => setType('topic')}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  type === 'topic'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent'
                }`}
              >
                <div className="font-medium">Topic</div>
                <div className="text-xs opacity-70 mt-0.5">Learning / reference (courses)</div>
              </button>
            </div>
          </div>
          <Button onClick={handleCreate} disabled={!title.trim()} className="w-full">
            Create Canvas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
