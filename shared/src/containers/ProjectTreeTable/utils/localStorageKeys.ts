/**
 * Generates a local storage key with a consistent format
 */
export const createLocalStorageKey = (page: string, key: string, projectName: string): string => {
  return `${page}-${key}-${projectName}`
}
