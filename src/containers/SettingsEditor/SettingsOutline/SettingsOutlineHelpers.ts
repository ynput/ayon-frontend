export type SettingsOutlineItem = {
  id: string
  title: string
  /** 1 for a card, 2 for a sub-group straight inside a card */
  depth: number
}

// What the outline lists: cards, and the sub-groups straight inside them
const OUTLINE_GROUPS = '.settings-group-card, .settings-group-subgroup[data-settings-depth="2"]'
// a group's title row, above its content or leading its first panel
const GROUP_TITLE = [
  ':scope > .settings-group-header .settings-group-title',
  ':scope > div > .form-object-field > .settings-panel-lead > .settings-group-header .settings-group-title',
].join(', ')

/** Reads the outline from the rendered sheet, so it follows scope, search and list edits */
export const readSettingsOutline = (sheet: HTMLElement): SettingsOutlineItem[] => {
  const items: SettingsOutlineItem[] = []
  sheet.querySelectorAll<HTMLElement>(OUTLINE_GROUPS).forEach((group) => {
    const id = group.dataset.fieldid
    const title = group.querySelector(GROUP_TITLE)?.textContent?.trim()
    if (!id || !title || group.closest('[data-hidden="true"]')) return
    items.push({ id, title, depth: Number(group.dataset.settingsDepth) })
  })
  return items
}

export const isSameOutline = (a: SettingsOutlineItem[], b: SettingsOutlineItem[]) =>
  a.length === b.length &&
  a.every(
    (item, i) => item.id === b[i].id && item.title === b[i].title && item.depth === b[i].depth,
  )

export const findSettingsGroup = (sheet: HTMLElement, id: string) =>
  sheet.querySelector<HTMLElement>(`.settings-group[data-fieldid="${CSS.escape(id)}"]`)

/** The element the sheet scrolls in, or null when that is the page itself */
export const getScrollParent = (node: HTMLElement | null): HTMLElement | null => {
  if (!node || node === document.body || node === document.documentElement) return null
  const { overflowY } = getComputedStyle(node)
  if (node.scrollHeight > node.clientHeight && !['visible', 'clip'].includes(overflowY)) {
    return node
  }
  return getScrollParent(node.parentElement)
}

// How long the sheet stays fully rendered when a jump never scrolls (already in place)
const JUMP_TIMEOUT = 2000

/**
 * Scrolls a group to the top of the sheet. Cards off screen skip rendering and stand in
 * with an estimated height (content-visibility), and a group in a skipped card has no
 * box to scroll to (Firefox may not scroll at all). So every card renders until the scroll
 * ends: the scroll lands on the group, and each card keeps its real height afterwards.
 */
export const scrollToSettingsGroup = (sheet: HTMLElement, group: HTMLElement) => {
  const scrollTarget: HTMLElement | Window = getScrollParent(sheet) ?? window
  let timer = 0
  const done = () => {
    window.clearTimeout(timer)
    scrollTarget.removeEventListener('scrollend', done)
    sheet.classList.remove('settings-sheet-measure')
  }
  sheet.classList.add('settings-sheet-measure')
  group.scrollIntoView({ behavior: 'smooth', block: 'start' })
  scrollTarget.addEventListener('scrollend', done)
  timer = window.setTimeout(done, JUMP_TIMEOUT)
}
