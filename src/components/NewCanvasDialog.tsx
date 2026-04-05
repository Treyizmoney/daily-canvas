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
import { Plus, X } from 'lucide-react'

interface NewCanvasDialogProps {
  onCreateCanvas: (title: string, type: 'project' | 'topic', tags: string[]) => void
}

export function NewCanvasDialog({ onCreateCanvas }: NewCanvasDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'project' | 'topic'>('project')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleCreate = () => {
    if (!title.trim()) return
    onCreateCanvas(title.trim(), type, tags)
    setTitle('')
    setType('project')
    setTags([])
    setTagInput('')
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
                <div className="text-xs opacity-70 mt-0.5">Ongoing work</div>
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
                <div className="text-xs opacity-70 mt-0.5">Learning / reference</div>
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex items-center gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addTag() }
                  if (e.key === ',' || e.key === ' ') { e.preventDefault(); addTag() }
                }}
              />
              <Button variant="ghost" size="sm" onClick={addTag} className="h-8">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/15 text-primary border border-primary/20"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleCreate} disabled={!title.trim()} className="w-full">
            Create Canvas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
