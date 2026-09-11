// Column layout is persisted on a debounce; saving a view has to write what is still waiting,
// and switching views has to throw it away instead of writing it into the new view.

type PendingColumnWriter = {
  flush: () => void
  drop: () => void
}

const pendingWriters = new Set<PendingColumnWriter>()

export const registerPendingColumnWrites = (writer: PendingColumnWriter) => {
  pendingWriters.add(writer)
  return () => {
    pendingWriters.delete(writer)
  }
}

export const flushPendingColumnWrites = () => {
  pendingWriters.forEach((writer) => writer.flush())
}

export const dropPendingColumnWrites = () => {
  pendingWriters.forEach((writer) => writer.drop())
}
