import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings as SettingsIcon } from 'lucide-react'
import { getAiConfig, setAiConfig } from '@/lib/ai'

export function Settings() {
  const [open, setOpen] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('')

  useEffect(() => {
    if (open) {
      const config = getAiConfig()
      setBaseUrl(config.baseUrl)
      setModel(config.model)
    }
  }, [open])

  const handleSave = () => {
    setAiConfig({ baseUrl, model })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Ollama URL</label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:11434"
            />
            <p className="text-xs text-muted-foreground">
              Point to your homeserver for heavier models (e.g. http://192.168.1.65:11434)
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Model</label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="qwen3:4b"
            />
            <p className="text-xs text-muted-foreground">
              Ollama model name (e.g. qwen3:4b, qwen3:14b, llama3.1:8b)
            </p>
          </div>
          <Button onClick={handleSave} className="w-full">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
