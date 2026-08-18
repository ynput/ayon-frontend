import { useLayoutEffect, useState } from 'react'

const BUTTON_GAP = 4

// offset that straddles the last column's edge, null when the button doesn't fit there
export const useLastColumnOffset = (container: HTMLDivElement | null) => {
  const [offset, setOffset] = useState<number | null>(null)

  useLayoutEffect(() => {
    const wrapper = container?.parentElement
    if (!container || !wrapper) return

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

    // the table can mount after this effect (loading or error placeholder first), so wait for it
    const observeTable = () => {
      const table = wrapper.querySelector('.table-container table')
      if (!table) return false
      resizeObserver.observe(table)
      measure()
      return true
    }

    const mutationObserver = new MutationObserver(() => {
      if (observeTable()) mutationObserver.disconnect()
    })
    if (!observeTable()) mutationObserver.observe(wrapper, { childList: true, subtree: true })
    measure()

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [container])

  return offset
}
