import { useState } from "react"
import { Selection } from "../types"

const useSelectionHandler = () => {
  const [selection, setSelection] = useState<Selection>({})
  const [selections, setSelections] = useState<Selection[]>([])
  const [selectionInProgress, setSelectionInProgress] = useState<boolean>(false)

// TDOO maybe swap x/y, they might be confusing later on (row is y, col is x)
const getSelectionInterval = (colIdx: number): { yStartIdx: number; yEndIdx: number }[] => {

  let matchingSets = []
  for (const selection of selections) {
    let selectionMatches = false
    const xStartIdx = Math.min(selection.start![1], selection.end![1])
    const xEndIdx = Math.max(selection.start![1], selection.end![1])
    if (colIdx < xStartIdx || colIdx > xEndIdx) {
      continue
    }

    selectionMatches = true
    const yStartIdx = Math.min(selection.start![0], selection.end![0])
    const yEndIdx = Math.max(selection.start![0], selection.end![0])
    matchingSets.push({ yStartIdx, yEndIdx })
  }

  return matchingSets
}

  return {
    selection,
    setSelection,
    selections,
    setSelections,
    selectionInProgress,
    setSelectionInProgress,
    getSelectionInterval,
  }
}
export default useSelectionHandler