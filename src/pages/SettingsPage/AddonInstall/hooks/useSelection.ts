import { MouseEvent, useState } from "react"

const useSelection = (initialSelected: number[] = [], initialFocused = -1) => {
  const [selection, setSelection] = useState<number[]>(initialSelected)
  const [focused, setFocused] = useState<number>(initialFocused)
  const [prevSelection, setPrevSelection] = useState<number | null>(null)

  const updateSelection = (newSelection: number[]) => {
    setSelection(newSelection)
  }

  const pushClickEvent = (e: MouseEvent, rowIdx: number) => {
    setFocused(rowIdx)
    if (!e.metaKey && !e.shiftKey) {
      setSelection([rowIdx])
    }
    if (e.metaKey) {
      if (selection.includes(rowIdx)) {
        setSelection(selection.filter((idx) => idx !== rowIdx))
        setFocused(-1)
      } else {
        setSelection([...selection, rowIdx])
      }
    }

    if (e.shiftKey) {
      if (prevSelection === null) {
        setPrevSelection(rowIdx)
        return
      }
      const start = Math.min(prevSelection, rowIdx)
      const end = Math.max(prevSelection, rowIdx)
      const newSelection = Array.from({ length: end - start + 1 }, (_, i) => i + start)
      setSelection(newSelection)
    }

    // Finally we update the prev selection for future interacitions
    setPrevSelection(rowIdx)
  }

  return { focused, selection, updateSelection, pushClickEvent }
}

export default useSelection