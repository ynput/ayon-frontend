import { readSessionStorage, writeSessionStorage } from '../hooks/useSessionStorage'

// Options a dialog remembers for the rest of the browser session, so making many items in a row
// does not mean picking the same type again each time. Values that only make sense in one project
// (entity subtypes, folders) are stored per project.

const memoryKey = (dialog: string, projectName?: string) =>
  projectName ? `dialog-memory:${dialog}:${projectName}` : `dialog-memory:${dialog}`

export const readDialogMemory = <T extends object>(
  dialog: string,
  projectName?: string,
): Partial<T> => readSessionStorage<Partial<T>>(memoryKey(dialog, projectName), {}) || {}

/** merges the values into what the dialog already remembers */
export const writeDialogMemory = <T extends object>(
  dialog: string,
  values: Partial<T>,
  projectName?: string,
): void => {
  const key = memoryKey(dialog, projectName)
  writeSessionStorage(key, { ...readSessionStorage<Partial<T>>(key, {}), ...values })
}
