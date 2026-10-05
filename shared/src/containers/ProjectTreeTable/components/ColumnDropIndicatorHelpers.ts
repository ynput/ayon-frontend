import type { LinePosition } from './ColumnDropIndicator'

export const getColumnDropLinePosition = (
  header: HTMLElement,
  side: 'left' | 'right',
): LinePosition => {
  const rect = header.getBoundingClientRect()
  const table = header.closest('table')?.getBoundingClientRect() ?? rect
  return {
    left: side === 'left' ? rect.left - 1 : rect.right - 1,
    top: table.top,
    height: table.height,
  }
}
