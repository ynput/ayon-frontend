// Column sizing/order/row height are persisted on a debounce, so a resize can still be waiting
// when the user saves the view. Saving reads the stored settings, which would then miss it.
// ColumnSettingsProvider registers its flush here for the views layer to call before saving.

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
