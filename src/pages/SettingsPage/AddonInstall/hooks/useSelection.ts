import { useState } from "react"

const useSelection = (initialSelected: string[] = []) => {
  const [selection, setSelection] = useState(initialSelected)

  const updateSelection = (newSelection: string[]) => {
    setSelection(newSelection)
  }

  return { selection, updateSelection }
}

export default useSelection