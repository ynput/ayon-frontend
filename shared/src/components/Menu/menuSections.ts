// Sections in menus: right-click menus (useCreateContextMenu) and dropdowns (MenuList).
// A divider is `{ id: 'divider' }` or `{ separator: true }`; MENU_DIVIDER is both, so it works in either.

type SectionItem = { id?: string; separator?: boolean; hidden?: boolean; danger?: boolean }

export const MENU_DIVIDER = { id: 'divider', separator: true }

export const isMenuDivider = (item: object) => {
  const { separator, id } = item as SectionItem
  return !!separator || id === 'divider'
}

/** Items in a section of their own, e.g. the items an addon slot contributes. Nothing when empty. */
export const menuSection = <T>(items: T[]): (T | typeof MENU_DIVIDER)[] =>
  items.length ? [MENU_DIVIDER, ...items, MENU_DIVIDER] : []

/**
 * Drops hidden items, puts the danger items at the bottom (Delete) in a section of their own, and
 * removes the dividers left at the start, at the end or next to another divider, so a section
 * whose items are all hidden leaves no line behind.
 */
export const tidyMenuSections = <T extends object>(
  items: (T | null | undefined | false)[],
): T[] => {
  const visible = items.filter((item): item is T => !!item && !(item as SectionItem).hidden)

  let firstDanger = visible.length
  while (firstDanger > 0 && (visible[firstDanger - 1] as SectionItem).danger) firstDanger--
  if (firstDanger < visible.length) visible.splice(firstDanger, 0, MENU_DIVIDER as T)

  const tidy: T[] = []
  for (const item of visible) {
    if (isMenuDivider(item) && (!tidy.length || isMenuDivider(tidy[tidy.length - 1]))) continue
    tidy.push(item)
  }
  if (tidy.length && isMenuDivider(tidy[tidy.length - 1])) tidy.pop()
  return tidy
}
