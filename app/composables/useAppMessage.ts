type AppMessageType = 'info' | 'success' | 'warning' | 'error'
type AppMessageActionKind = 'reload' | 'home'

type AppMessageAction = {
  label: string
  kind: AppMessageActionKind
}

type AppMessage = {
  id: string
  type: AppMessageType
  title: string
  description?: string
  traceId?: string
  action?: AppMessageAction
}

type NotifyInput = {
  type?: AppMessageType
  title: string
  description?: string
  traceId?: string
  action?: AppMessageAction
  duration?: number
}

const DEFAULT_DURATION = 4200

export function useAppMessage() {
  const messages = useState<AppMessage[]>('app:messages', () => [])

  function notify(input: NotifyInput) {
    const message: AppMessage = {
      id: crypto.randomUUID(),
      type: input.type || 'info',
      title: input.title,
      description: input.description,
      traceId: input.traceId,
      action: input.action
    }

    messages.value = [message, ...messages.value].slice(0, 4)

    if (import.meta.client && input.duration !== 0) {
      window.setTimeout(() => dismiss(message.id), input.duration || DEFAULT_DURATION)
    }

    return message.id
  }

  function dismiss(id: string) {
    messages.value = messages.value.filter((message) => message.id !== id)
  }

  function clear() {
    messages.value = []
  }

  return {
    messages,
    notify,
    dismiss,
    clear
  }
}
