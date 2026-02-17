/**
 * Checks if keyboard shortcuts should be blocked based on the event target
 * @param e - The keyboard event
 * @returns true if shortcuts should be blocked, false otherwise
 */
export const shouldBlockShortcuts = (e: KeyboardEvent): boolean => {
  const target = e.target as HTMLElement

  // Block shortcuts when typing in inputs or textareas
  if (['INPUT', 'TEXTAREA'].includes(target?.tagName)) {
    return true
  }

  // Block shortcuts when the element has 'block-shortcuts' class
  if (target?.classList.contains('block-shortcuts')) {
    return true
  }

  // Block shortcuts when any parent element has 'block-shortcuts' class
  if (target?.closest('.block-shortcuts')) {
    return true
  }

  return false
}