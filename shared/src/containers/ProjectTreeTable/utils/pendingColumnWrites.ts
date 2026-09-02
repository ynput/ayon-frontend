// Column layout is persisted on a debounce; saving a view has to write what is still waiting.

type FlushPendingColumnWrites = () => void

const pendingWriters = new Set<FlushPendingColumnWrites>()

export const registerPendingColumnWrites = (flush: FlushPendingColumnWrites) => {
  pendingWriters.add(flush)
  return () => {
    pendingWriters.delete(flush)
  }
}

export const flushPendingColumnWrites = () => {
  pendingWriters.forEach((flush) => flush())
}
