import { MouseEvent, useCallback } from 'react'
import { $Any } from '@types'
import { Selection } from './types'

type Props = {
  setSelectionInProgress: $Any
  selection: $Any
  setSelection: $Any
  selections: $Any
  setSelections: $Any
}
const useHandlers = ({
  setSelectionInProgress,
  selection,
  setSelection,
  selections,
  setSelections,
}: Props) => {
  const handleMouseDown = (
    e: MouseEvent<HTMLTableCellElement, MouseEvent>,
    rowIdx: $Any,
    colIdx: $Any,
  ) => {
    setSelectionInProgress(true)
    if (e.shiftKey) {
      return
    }
    setSelection({ start: [rowIdx, colIdx] })
  }

  const handleMouseUp = (
    e: MouseEvent<HTMLTableCellElement, MouseEvent>,
    rowIdx: $Any,
    colIdx: $Any,
  ) => {
    let newSelection: Selection= {}
    const lastPos: [number, number] = [rowIdx, colIdx]
    if (e.shiftKey) {
      newSelection = { start: selection.start, end: [rowIdx, colIdx] }
    } else {
      newSelection = { start: lastPos, end: lastPos }
    }
    if (e.metaKey) {
      const findFn = (el: Selection) =>
        el.start![0] == lastPos[0] &&
        el.start![1] == lastPos[1] &&
        el.end![0] == lastPos[0] &&
        el.end![1] == lastPos[1]
      if (selections.find(findFn)) {
        setSelections((prev: $Any) => prev.filter((el: $Any) => !findFn(el)))
      } else {
        setSelections((prev: $Any) => [...prev, newSelection])
      }
    } else {
      setSelections([newSelection])
    }
    setSelectionInProgress(false)
  }
  return { handleMouseUp, handleMouseDown }
}

const handleToggleFolder = (setExpandedItem: $Any) =>
  useCallback(
    async (_: $Any, folderId: string) => {
      setExpandedItem(folderId)
    },
    [setExpandedItem],
  )

export { handleToggleFolder }

export default useHandlers
