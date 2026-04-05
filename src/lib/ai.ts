export interface AiConfig {
  baseUrl: string
  model: string
}

const DEFAULT_CONFIG: AiConfig = {
  baseUrl: 'http://localhost:11434',
  model: 'qwen3:4b',
}

let config: AiConfig = { ...DEFAULT_CONFIG }

export function setAiConfig(newConfig: Partial<AiConfig>) {
  config = { ...config, ...newConfig }
}

export function getAiConfig(): AiConfig {
  return { ...config }
}

export interface AiStreamCallbacks {
  onToken: (token: string) => void
  onDone: () => void
  onError: (error: string) => void
}

export async function askAi(
  context: string,
  prompt: string,
  callbacks: AiStreamCallbacks,
): Promise<void> {
  const fullPrompt = context
    ? `Context:\n${context}\n\nUser request: ${prompt}`
    : prompt

  try {
    const response = await fetch(`${config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt: fullPrompt,
        stream: true,
      }),
    })

    if (!response.ok) {
      callbacks.onError(`Ollama error: ${response.status} ${response.statusText}`)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      callbacks.onError('No response stream')
      return
    }

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(Boolean)

      for (const line of lines) {
        try {
          const data = JSON.parse(line)
          if (data.response) {
            callbacks.onToken(data.response)
          }
          if (data.done) {
            callbacks.onDone()
            return
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    callbacks.onDone()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      callbacks.onError(`Cannot connect to Ollama at ${config.baseUrl}. Is it running?`)
    } else {
      callbacks.onError(msg)
    }
  }
}
