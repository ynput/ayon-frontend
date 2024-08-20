import { useEffect, useState } from 'react'

const useWidthsCalculator = (
  containerRef,
  listItemsRef,
  isLoading,
  groupedTasks,
  filteredFields,
) => {
  // keep track of the longest folder name and task name
  const [minWidths, setMinWidths] = useState({})

  useEffect(() => {
    setMinWidths({ folder: 100, task: 100})
    const calculateMinWidths = () => {
      const listItems = containerRef.current.querySelectorAll('li:not(.none)')
      // store the list items in the ref
      listItemsRef.current = listItems
      // from all of the items, find the one with the longest className='folder' and set the width of the folder column to that
      const reducerCallback = (className) => (acc, item) => {
        const folder = item.querySelector(className)
        if (!folder) return acc
        const width = folder.getBoundingClientRect().width
        return Math.max(acc, width)
      }

      const minFolderWidth = Array.from(listItems).reduce(reducerCallback('.folder'), 0)
      const minTaskWidth = Array.from(listItems).reduce(reducerCallback('.task'), 0)

      setMinWidths({ folder: minFolderWidth, task: minTaskWidth })
    }

    const domObserver = new MutationObserver(calculateMinWidths)
    if (containerRef?.current?.querySelectorAll('li:not(.none)').length > 0) {
      domObserver.observe(containerRef.current.querySelectorAll('li:not(.none)')[0], {
        childList: true,
        subtree: true,
      })
    }
  }, [containerRef.current, isLoading, groupedTasks, filteredFields])

  return { minWidths }
}

export { useWidthsCalculator }
