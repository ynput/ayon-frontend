import { RefObject, useEffect, useState } from 'react'

// with more reviewables than this, they need a guaranteed share of the toolbar
const MAX_REVIEWABLES_WITHOUT_MIN_HEIGHT = 3
// minimum share of the toolbar height the reviewables get when stacked above the tools
const MIN_REVIEWABLES_HEIGHT_RATIO = 0.3

export type ReviewablesLayout = 'column' | 'row'

type Options = {
  containerRef: RefObject<HTMLElement>
  toolsRef: RefObject<HTMLElement>
  reviewablesCount: number
}

/**
 * Stacks the reviewables above the annotation tools while there is room for them.
 * Once there are more than 3 reviewables and they would get less than 30% of the
 * container height, the tools and reviewables are laid out side by side instead.
 */
export function useReviewablesLayout({
  containerRef,
  toolsRef,
  reviewablesCount,
}: Options): ReviewablesLayout {
  const [containerHeight, setContainerHeight] = useState(0)
  const [toolsHeight, setToolsHeight] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    const tools = toolsRef.current
    if (!container) return

    // the tools keep their height in both layouts, so measuring them never flips the layout back
    const update = () => {
      setContainerHeight(container.clientHeight)
      setToolsHeight(tools?.offsetHeight ?? 0)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    if (tools) observer.observe(tools)

    return () => observer.disconnect()
  }, [containerRef, toolsRef])

  if (reviewablesCount <= MAX_REVIEWABLES_WITHOUT_MIN_HEIGHT) return 'column'
  if (!containerHeight || !toolsHeight) return 'column'

  const reviewablesHeight = containerHeight - toolsHeight
  return reviewablesHeight < containerHeight * MIN_REVIEWABLES_HEIGHT_RATIO ? 'row' : 'column'
}
