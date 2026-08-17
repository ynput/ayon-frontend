import { useLayoutEffect, useState } from 'react'

const BUTTON_GAP = 4

// offset that straddles the last column's edge, null when the button doesn't fit there
export const useLastColumnOffset = (container: HTMLDivElement | null) => {
  const [offset, setOffset] = useState<number | null>(null)

  useLayoutEffect(() => {
    const wrapper = container?.parentElement
    const table = wrapper?.querySelector('.table-container table')
    if (!container || !wrapper || !table) return

    const measure = () => {
      // not the table's own width: the selection column reserves more than it paints
      const lastHeaderCell = wrapper.querySelector('.table-container thead tr')?.lastElementChild
      if (!lastHeaderCell) return

      const wrapperRect = wrapper.getBoundingClientRect()
      const columnsEnd = lastHeaderCell.getBoundingClientRect().right - wrapperRect.left
      const half = container.offsetWidth / 2
      const fits = columnsEnd + half + BUTTON_GAP <= wrapperRect.width
      setOffset(fits ? columnsEnd - half : null)
    }

    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(wrapper)
    resizeObserver.observe(table)
    measure()

    return () => resizeObserver.disconnect()
  }, [container])

  return offset
}
