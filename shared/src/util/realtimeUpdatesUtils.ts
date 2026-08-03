// @ts-ignore
const isDev = import.meta.env.VITE_DEV === 'true'

export const REALTIME_UPDATE_DEBOUNCE = isDev ? 500 : 10000
export const REALTIME_REST_CALL_LIMIT = 25
export const REALTIME_REST_JITTER = 1000

// the update topics that include the new data in the summary value, which can be used to update the local cache
export const REALTIME_TASK_SUPPORTED_VALUE_FIELDS = ['status', 'tags', 'assignees', 'type'] as const
export type SupportedTaskField = (typeof REALTIME_TASK_SUPPORTED_VALUE_FIELDS)[number]

export type SupportedEntityPatchField = string

export function getSupportedEntityPatch(
  field: string,
  summary: any,
  supportedFields: readonly string[],
): { field: SupportedEntityPatchField; value: string | string[] } | undefined {
  if (!supportedFields.includes(field)) return undefined

  const value = summary?.value
  if (value === undefined) return undefined

  if (field === 'tags') {
    return {
      field: 'tags',
      value: Array.isArray(value) ? value.map(String) : [],
    }
  }

  if (field === 'assignees') {
    return {
      field: 'assignees',
      value: Array.isArray(value) ? value.map(String) : [],
    }
  }

  return { field: field as SupportedEntityPatchField, value: String(value) }
}

export const waitForRealtimeJitter = () =>
  new Promise<void>((resolve) => setTimeout(resolve, Math.random() * REALTIME_REST_JITTER))

export function createRealtimeBatcher<T>(
  onBatch: (items: T[]) => void | Promise<void>,
  getKey: (item: T) => string,
  delay = REALTIME_UPDATE_DEBOUNCE,
) {
  const pending = new Map<string, T>()
  let timer: ReturnType<typeof setTimeout> | null = null
  let processing = false

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const run = async () => {
    clearTimer()
    if (processing) return
    if (pending.size === 0) return

    processing = true
    const items = Array.from(pending.values())
    pending.clear()
    try {
      await onBatch(items)
    } finally {
      processing = false
      if (pending.size > 0) schedule()
    }
  }

  const schedule = () => {
    clearTimer()
    timer = setTimeout(run, delay)
  }

  return {
    add(item: T) {
      pending.set(getKey(item), item)
      schedule()
    },
    schedule,
    clear() {
      pending.clear()
      clearTimer()
    },
  }
}
