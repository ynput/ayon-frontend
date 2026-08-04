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

export type RealtimeBatchProcessor<T> = (
  items: T[],
  isActive: () => boolean,
) => void | Promise<void>

export function createRealtimeBatcher<T>(
  onBatch: RealtimeBatchProcessor<T>,
  getKey: (item: T) => string,
  delay = REALTIME_UPDATE_DEBOUNCE,
) {
  const pending = new Map<string, T>()
  let timer: ReturnType<typeof setTimeout> | null = null
  let processing = false
  let disposed = false

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const run = async () => {
    clearTimer()
    if (disposed || processing) return
    if (pending.size === 0) return

    processing = true
    const entries = Array.from(pending.entries()).slice(0, REALTIME_REST_CALL_LIMIT)
    const items = entries.map(([, item]) => item)
    entries.forEach(([key]) => pending.delete(key))
    try {
      await onBatch(items, () => !disposed)
    } catch (error) {
      console.error('Realtime batch processing failed', error)
    } finally {
      processing = false
      if (!disposed && pending.size > 0) schedule(0)
    }
  }

  const schedule = (scheduleDelay = delay) => {
    if (disposed || timer || processing) return
    timer = setTimeout(run, scheduleDelay)
  }

  return {
    add(item: T) {
      if (disposed) return
      pending.set(getKey(item), item)
      schedule()
    },
    schedule,
    clear() {
      disposed = true
      pending.clear()
      clearTimer()
    },
  }
}
